import { analyzeGrievance } from "../services/nlp.service.js";
import { getDb } from "../config/db.js";
import { sendTelegramNotification, sendTelegramPoll } from "../services/telegram.service.js";
import { triggerProximityPoll, findNearbyUsers } from "../services/proximity.service.js";

// Helper function to convert DB row to API format
const mapDbToApi = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        text: row.text,
        language: row.language,
        location: row.location ? JSON.parse(row.location) : null,
        analysis: row.analysis ? JSON.parse(row.analysis) : null,
        status: row.status,
        assignedDepartment: row.assigned_department,
        image: row.image || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
    };
};

export const getComplaints = async (req, res) => {
    try {
        const db = await getDb();
        const data = await db.all('SELECT * FROM complaints ORDER BY created_at DESC');
        
        const complaints = data.map(mapDbToApi);
        console.log(`Returning ${complaints.length} complaints from database`);
        
        res.json(complaints);
    } catch (error) {
        console.error("Error in getComplaints:", error);
        res.status(500).json({ error: "Failed to fetch complaints" });
    }
};

export const createComplaint = async (req, res) => {
    try {
        const { text, location, language, image } = req.body;
        // In reality, user ID would come from JWT or authenticated session
        const userId = req.body.userId || null; 

        if (!text || !location) {
            return res.status(400).json({ error: "Text and location are required" });
        }

        const analysis = await analyzeGrievance(text);
        
        const db = await getDb();

        const latestRecord = await db.get('SELECT id FROM complaints ORDER BY created_at DESC LIMIT 1');

        const now = new Date();
        const year = now.getFullYear();
        
        let nextNumber = 1;
        if (latestRecord && latestRecord.id) {
            const match = latestRecord.id.match(/GRV-\d{4}-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        
        const id = `GRV-${year}-${String(nextNumber).padStart(3, "0")}`;

        const locationStr = JSON.stringify(location);
        const analysisObj = {
            ...analysis,
            confidence: analysis.confidence || 0.9,
            keywords: analysis.keywords || [],
        };
        const analysisStr = JSON.stringify(analysisObj);
        const assignedDepartment = analysis.suggestedDepartment;

        // Extract lat/lng from location object
        const latitude = location.latitude || null;
        const longitude = location.longitude || null;

        await db.run(
            `INSERT INTO complaints 
            (id, user_id, text, language, location, latitude, longitude, analysis, status, assigned_department, image, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, text, language || "en", locationStr, latitude, longitude, analysisStr, "pending", assignedDepartment, image || null, null]
        );

        const newComplaint = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);
        
        const response = mapDbToApi(newComplaint);
        res.status(201).json(response);

        // Trigger proximity poll asynchronously (don't block the response)
        if (latitude && longitude) {
            triggerProximityPoll(id, latitude, longitude, text).catch((err) => {
                console.error("Proximity poll error (non-fatal):", err.message);
            });
        }

        // Also update user's location if they filed the complaint with coordinates
        if (userId && latitude && longitude) {
            db.run(
                'UPDATE users SET latitude = ?, longitude = ? WHERE id = ? AND (latitude IS NULL OR longitude IS NULL)',
                [latitude, longitude, userId]
            ).catch(() => {});
        }

    } catch (error) {
        console.error("Error creating complaint:", error);
        res.status(500).json({ error: "Failed to create complaint" });
    }
};

export const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, assignedDepartment, category } = req.body;

        const db = await getDb();
        
        let updateQuery = 'UPDATE complaints SET ';
        const updateValues = [];
        
        if (status) {
            updateQuery += 'status = ?';
            updateValues.push(status);
        }
        if (notes !== undefined) {
            if (updateValues.length > 0) updateQuery += ', ';
            updateQuery += 'notes = ?';
            updateValues.push(notes);
        }
        if (assignedDepartment !== undefined) {
            if (updateValues.length > 0) updateQuery += ', ';
            updateQuery += 'assigned_department = ?';
            updateValues.push(assignedDepartment);
        }
        if (category) {
            const existingRow = await db.get('SELECT analysis FROM complaints WHERE id = ?', [id]);
            if (existingRow && existingRow.analysis) {
                const analysisObj = JSON.parse(existingRow.analysis);
                analysisObj.category = category;
                if (updateValues.length > 0) updateQuery += ', ';
                updateQuery += 'analysis = ?';
                updateValues.push(JSON.stringify(analysisObj));
            }
        }
        
        if (updateValues.length === 0) return res.json({});
        
        updateQuery += ' WHERE id = ?';
        updateValues.push(id);

        const result = await db.run(updateQuery, updateValues);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        const updatedRow = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);
        res.json(mapDbToApi(updatedRow));

        // Send Telegram notification if status changed
        if (status && updatedRow?.user_id) {
            const user = await db.get('SELECT telegram_chat_id FROM users WHERE id = ?', [updatedRow.user_id]);
            if (user?.telegram_chat_id) {
                const statusEmoji = { pending: '🟡', in_progress: '🔵', resolved: '🟢' };
                const emoji = statusEmoji[status] || '⚪';
                sendTelegramNotification(
                    user.telegram_chat_id,
                    `${emoji} *Status Update — ${id}*\n\nYour complaint status has been changed to *${status.replace('_', ' ').toUpperCase()}*.\n\n${notes ? `📝 Note: _${notes}_` : ''}\n\nUse /status ${id} for full details.`
                ).catch(() => {});
            }
        }
    } catch (error) {
        console.error("Error updating complaint:", error);
        res.status(500).json({ error: "Failed to update complaint" });
    }
};

export const getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        
        const data = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);

        if (!data) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        res.json(mapDbToApi(data));
    } catch (error) {
        console.error("Error in getComplaintById:", error);
        res.status(500).json({ error: "Failed to fetch complaint" });
    }
};

// ===================== Admin: Trigger Community Poll =====================

export const triggerPoll = async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        const complaint = await db.get("SELECT * FROM complaints WHERE id = ?", [id]);
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        const lat = complaint.latitude;
        const lng = complaint.longitude;

        if (!lat || !lng) {
            // Try to parse from location JSON
            const loc = complaint.location ? JSON.parse(complaint.location) : {};
            if (!loc.latitude || !loc.longitude) {
                return res.status(400).json({ error: "Complaint has no location coordinates. Cannot send poll to nearby users." });
            }
            // Use from location JSON
            await triggerProximityPoll(id, loc.latitude, loc.longitude, complaint.text);
            
            const nearbyUsers = await findNearbyUsers(loc.latitude, loc.longitude, 500, complaint.user_id);
            return res.json({
                success: true,
                message: `Poll sent to ${nearbyUsers.length} nearby users`,
                nearbyUsersCount: nearbyUsers.length,
            });
        }

        // Send poll to nearby users
        const nearbyUsers = await findNearbyUsers(lat, lng, 500, complaint.user_id);

        if (nearbyUsers.length === 0) {
            return res.json({
                success: true,
                message: "No Telegram users found within 500m radius",
                nearbyUsersCount: 0,
            });
        }

        await triggerProximityPoll(id, lat, lng, complaint.text);

        res.json({
            success: true,
            message: `Poll sent to ${nearbyUsers.length} nearby residents`,
            nearbyUsersCount: nearbyUsers.length,
        });
    } catch (error) {
        console.error("Error triggering poll:", error);
        res.status(500).json({ error: "Failed to trigger poll" });
    }
};

// ===================== Admin: Get Poll Results =====================

export const getPollResults = async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        // Get all polls for this complaint
        const polls = await db.all(
            "SELECT * FROM polls WHERE complaint_id = ? ORDER BY created_at DESC",
            [id]
        );

        if (polls.length === 0) {
            return res.json({ polls: [], totalYes: 0, totalNo: 0, totalPolled: 0 });
        }

        let totalYes = 0;
        let totalNo = 0;
        let totalPolled = 0;

        const pollDetails = [];

        for (const poll of polls) {
            const votes = await db.all(
                "SELECT pv.*, u.name, u.telegram_username FROM poll_votes pv JOIN users u ON pv.user_id = u.id WHERE pv.poll_id = ?",
                [poll.id]
            );

            totalYes += poll.yes_count;
            totalNo += poll.no_count;
            totalPolled += votes.length;

            pollDetails.push({
                id: poll.id,
                question: poll.question,
                yesCount: poll.yes_count,
                noCount: poll.no_count,
                totalVotes: votes.length,
                createdAt: poll.created_at,
                votes: votes.map((v) => ({
                    userName: v.name,
                    telegramUsername: v.telegram_username,
                    vote: v.vote,
                    votedAt: v.created_at,
                })),
            });
        }

        res.json({
            polls: pollDetails,
            totalYes,
            totalNo,
            totalPolled,
        });
    } catch (error) {
        console.error("Error getting poll results:", error);
        res.status(500).json({ error: "Failed to fetch poll results" });
    }
};
