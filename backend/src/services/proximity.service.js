import { getDb } from "../config/db.js";
import { sendTelegramPoll } from "./telegram.service.js";

const PROXIMITY_RADIUS_METERS = 500;
const ESCALATION_THRESHOLD = 3; // minimum "yes" votes to escalate

/**
 * Haversine formula — distance between two lat/lng points in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Find users within a given radius (meters) who have a linked Telegram account.
 * Excludes the user who filed the complaint (excludeUserId).
 */
export async function findNearbyUsers(lat, lng, radiusMeters = PROXIMITY_RADIUS_METERS, excludeUserId = null) {
    const db = await getDb();

    // Rough bounding box pre-filter (±0.01 deg ≈ 1.1 km)
    const delta = (radiusMeters / 111000) * 1.5; // generous margin
    const minLat = lat - delta;
    const maxLat = lat + delta;
    const minLng = lng - delta;
    const maxLng = lng + delta;

    let query = `
        SELECT id, name, telegram_chat_id, latitude, longitude 
        FROM users 
        WHERE telegram_chat_id IS NOT NULL 
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND latitude BETWEEN ? AND ?
          AND longitude BETWEEN ? AND ?
    `;
    const params = [minLat, maxLat, minLng, maxLng];

    if (excludeUserId) {
        query += " AND id != ?";
        params.push(excludeUserId);
    }

    const candidates = await db.all(query, params);

    // Fine-grained Haversine filter
    return candidates.filter((user) => {
        const dist = haversineDistance(lat, lng, user.latitude, user.longitude);
        return dist <= radiusMeters;
    });
}

/**
 * Trigger a proximity poll for a newly filed complaint.
 * Sends a Telegram poll to all nearby users asking if they face the same issue.
 */
export async function triggerProximityPoll(complaintId, lat, lng, complaintText) {
    const db = await getDb();

    // Get the complaint to find the owner
    const complaint = await db.get("SELECT user_id FROM complaints WHERE id = ?", [complaintId]);
    const excludeUserId = complaint?.user_id || null;

    // Find nearby users
    const nearbyUsers = await findNearbyUsers(lat, lng, PROXIMITY_RADIUS_METERS, excludeUserId);

    if (nearbyUsers.length === 0) {
        console.log(`📍 No nearby Telegram users found for complaint ${complaintId}`);
        return;
    }

    console.log(`📍 Found ${nearbyUsers.length} nearby users for complaint ${complaintId}`);

    // Create poll record
    const shortText = complaintText.length > 100 ? complaintText.substring(0, 100) + "..." : complaintText;
    const question = `🏘️ A resident near you reported: "${shortText}" — Are you facing this issue too?`;

    // Telegram polls have a 300-char limit for the question
    const truncatedQuestion = question.length > 295 ? question.substring(0, 292) + "..." : question;

    const result = await db.run(
        "INSERT INTO polls (complaint_id, question) VALUES (?, ?)",
        [complaintId, truncatedQuestion]
    );
    const pollId = result.lastID;

    // Send poll to each nearby user
    let sentCount = 0;
    for (const user of nearbyUsers) {
        try {
            const sent = await sendTelegramPoll(
                user.telegram_chat_id,
                truncatedQuestion,
                pollId,
                user.id
            );
            if (sent) sentCount++;
        } catch (err) {
            console.error(`Failed to send poll to user ${user.id}:`, err.message);
        }
    }

    console.log(`📊 Proximity poll sent to ${sentCount}/${nearbyUsers.length} nearby users for ${complaintId}`);
}
