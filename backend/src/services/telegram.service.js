import TelegramBot from "node-telegram-bot-api";
import { getDb } from "../config/db.js";
import { analyzeGrievance } from "./nlp.service.js";
import { triggerProximityPoll } from "./proximity.service.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT;

let bot = null;

// In-memory conversation state: chatId -> { step, data }
const conversations = new Map();

// Pre-registration token store: token -> { chatId, firstName, lastName, username, linkedAt }
export const linkTokens = new Map();

// ═══════════════════════════════════════════════════════
//  CATEGORY & DEPARTMENT MAPPING
// ═══════════════════════════════════════════════════════

const CATEGORY_LABELS = {
    healthcare: "🏥  Healthcare",
    roads: "🛣️  Roads & Infrastructure",
    education: "📚  Education",
    public_transport: "🚌  Public Transport",
    sanitation: "🧹  Sanitation & Cleanliness",
    water_supply: "💧  Water Supply",
    corruption: "⚖️  Corruption & Misconduct",
    electricity: "⚡  Electricity",
};

// ═══════════════════════════════════════════════════════
//  MAIN MENU KEYBOARD
// ═══════════════════════════════════════════════════════

function mainMenuKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: "📝  File a Complaint", callback_data: "action_complain" },
                { text: "📋  My Complaints", callback_data: "action_status" },
            ],
            [
                { text: "ℹ️  Help & Info", callback_data: "action_help" },
            ],
        ],
    };
}

// ═══════════════════════════════════════════════════════
//  INITIALIZE BOT
// ═══════════════════════════════════════════════════════

export function initTelegramBot() {
    if (!BOT_TOKEN) {
        console.warn("⚠️  TELEGRAM_BOT token not set — bot disabled");
        return null;
    }

    const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
    if (isVercel) {
        bot = new TelegramBot(BOT_TOKEN, { polling: false });
        console.log("🤖 Telegram bot started (webhook / outbound mode)");
    } else {
        bot = new TelegramBot(BOT_TOKEN, { polling: true });
        console.log("🤖 Telegram bot started (polling mode)");
    }

    // Suppress noisy polling errors
    bot.on("polling_error", (err) => {
        if (err.code !== "ETELEGRAM") {
            console.error("Telegram polling error:", err.message);
        }
    });

    // ── Command handlers ──
    bot.onText(/\/start(.*)/, handleStart);
    bot.onText(/\/complain/, handleComplainStart);
    bot.onText(/\/status(.*)/, handleStatus);
    bot.onText(/\/help/, handleHelp);

    // ── Callback query handler (button presses) ──
    bot.on("callback_query", handleCallbackQuery);

    // ── Location handler ──
    bot.on("location", handleLocation);

    // ── Photo handler (for complaint images) ──
    bot.on("photo", handlePhoto);

    // ── Generic message handler (multi-step flows) ──
    bot.on("message", handleMessage);

    // ── Poll answer handler ──
    bot.on("poll_answer", handlePollAnswer);

    return bot;
}

export function getBot() {
    return bot;
}

// ═══════════════════════════════════════════════════════
//  CALLBACK QUERY HANDLER (BUTTON PRESSES)
// ═══════════════════════════════════════════════════════

async function handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const data = query.data;

    // Acknowledge the button press
    bot.answerCallbackQuery(query.id);

    switch (data) {
        case "action_complain":
            await handleComplainStart({ chat: { id: chatId }, from: query.from });
            break;
        case "action_status":
            await handleStatus({ chat: { id: chatId }, from: query.from }, [null, ""]);
            break;
        case "action_help":
            await handleHelp({ chat: { id: chatId } });
            break;
        case "skip_image":
            await handleSkipImage(chatId);
            break;
        case "cancel_complaint":
            conversations.delete(chatId);
            bot.sendMessage(chatId, "🚫  _Complaint cancelled._", {
                parse_mode: "Markdown",
                reply_markup: { remove_keyboard: true },
            });
            sendMainMenu(chatId);
            break;
        default:
            // Handle status_<id> queries
            if (data.startsWith("status_")) {
                const complaintId = data.substring("status_".length);
                await showComplaintDetail(chatId, query.from, complaintId);
            }
            break;
    }
}

// ═══════════════════════════════════════════════════════
//  /start — WELCOME & DEEP LINKING
// ═══════════════════════════════════════════════════════

async function handleStart(msg, match) {
    const chatId = msg.chat.id;
    const payload = match[1]?.trim();

    // ── No payload: show welcome ──
    if (!payload) {
        const firstName = msg.from?.first_name || "there";
        bot.sendMessage(
            chatId,
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏛️  *CITIZEN CONNECT*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Hello *${firstName}*! 👋\n\n` +
            `Welcome to the official *Citizen Grievance Bot*.\n\n` +
            `Here you can:\n` +
            `  📝  File complaints about civic issues\n` +
            `  📋  Track your complaint status\n` +
            `  🔔  Receive real-time updates\n` +
            `  🗳️  Participate in community polls\n\n` +
            `_Use the buttons below to get started:_`,
            {
                parse_mode: "Markdown",
                reply_markup: mainMenuKeyboard(),
            }
        );
        return;
    }

    // ── Pre-registration flow: register_<token> ──
    if (payload.startsWith("register_")) {
        const token = payload.substring("register_".length);
        if (!token) {
            bot.sendMessage(chatId, "❌  Invalid registration link.");
            return;
        }

        linkTokens.set(token, {
            chatId: String(chatId),
            firstName: msg.from?.first_name || "",
            lastName: msg.from?.last_name || "",
            username: msg.from?.username || "",
            linkedAt: Date.now(),
        });

        // Cleanup old tokens (>15 min)
        for (const [key, val] of linkTokens.entries()) {
            if (Date.now() - val.linkedAt > 15 * 60 * 1000) {
                linkTokens.delete(key);
            }
        }

        const displayName = msg.from?.first_name || "there";
        bot.sendMessage(
            chatId,
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅  *TELEGRAM CONNECTED*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Hello *${displayName}*! 🎉\n\n` +
            `Your Telegram account is now linked to the\n` +
            `registration page.\n\n` +
            `👉  _Please go back to the website to complete\nyour registration._\n\n` +
            `Once registered, you'll be able to use all\n` +
            `features directly here in the bot.`,
            { parse_mode: "Markdown" }
        );
        return;
    }

    // ── Post-registration flow: <userId> ──
    const userId = parseInt(payload, 10);
    if (isNaN(userId)) {
        bot.sendMessage(chatId, "❌  Invalid link. Please use the link from the website.");
        return;
    }

    try {
        const db = await getDb();
        const user = await db.get("SELECT id, name FROM users WHERE id = ?", [userId]);
        if (!user) {
            bot.sendMessage(chatId, "❌  User not found. Please register on the website first.");
            return;
        }

        const existingLink = await db.get(
            "SELECT id, name FROM users WHERE telegram_chat_id = ? AND id != ?",
            [String(chatId), userId]
        );
        if (existingLink) {
            bot.sendMessage(
                chatId,
                `⚠️  This Telegram account is already linked to *${existingLink.name}*.`,
                { parse_mode: "Markdown" }
            );
            return;
        }

        await db.run(
            "UPDATE users SET telegram_chat_id = ?, telegram_username = ? WHERE id = ?",
            [String(chatId), msg.from?.username || null, userId]
        );

        bot.sendMessage(
            chatId,
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅  *ACCOUNT LINKED*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Welcome, *${user.name}*! 🎉\n\n` +
            `Your account is now connected.\n` +
            `Use the buttons below to get started:`,
            {
                parse_mode: "Markdown",
                reply_markup: mainMenuKeyboard(),
            }
        );
    } catch (error) {
        console.error("Error linking Telegram account:", error);
        bot.sendMessage(chatId, "❌  Something went wrong. Please try again.");
    }
}

// ═══════════════════════════════════════════════════════
//  SEND MAIN MENU
// ═══════════════════════════════════════════════════════

function sendMainMenu(chatId) {
    bot.sendMessage(
        chatId,
        `🏛️  *What would you like to do?*`,
        {
            parse_mode: "Markdown",
            reply_markup: mainMenuKeyboard(),
        }
    );
}

// ═══════════════════════════════════════════════════════
//  /complain — FILE A NEW COMPLAINT
// ═══════════════════════════════════════════════════════

async function handleComplainStart(msg) {
    const chatId = msg.chat.id;

    const db = await getDb();
    const user = await db.get("SELECT id, name FROM users WHERE telegram_chat_id = ?", [
        String(chatId),
    ]);

    if (!user) {
        bot.sendMessage(
            chatId,
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `⚠️  *ACCOUNT NOT LINKED*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Your Telegram is not linked to an account.\n\n` +
            `Please register at the Citizen Connect\n` +
            `website first, then connect your Telegram.`,
            { parse_mode: "Markdown" }
        );
        return;
    }

    conversations.set(chatId, {
        step: "awaiting_text",
        data: { userId: user.id, userName: user.name },
    });

    bot.sendMessage(
        chatId,
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📝  *FILE A NEW COMPLAINT*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `*Step 1 of 3* — Describe your issue\n\n` +
        `Please type out your grievance in detail.\n` +
        `Include:\n\n` +
        `  📍  Where the issue is located\n` +
        `  📅  How long it has been happening\n` +
        `  ⚠️  How it affects you or your community\n\n` +
        `_The more detail you provide, the better our\nAI can categorise and prioritise your complaint._`,
        {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌  Cancel", callback_data: "cancel_complaint" }],
                ],
            },
        }
    );
}

// ═══════════════════════════════════════════════════════
//  /status — VIEW COMPLAINTS
// ═══════════════════════════════════════════════════════

async function handleStatus(msg, match) {
    const chatId = msg.chat.id;
    const specificId = match?.[1]?.trim();

    const db = await getDb();
    const user = await db.get("SELECT id FROM users WHERE telegram_chat_id = ?", [
        String(chatId),
    ]);

    if (!user) {
        bot.sendMessage(
            chatId,
            `⚠️  _Your Telegram is not linked. Register on the website first._`,
            { parse_mode: "Markdown" }
        );
        return;
    }

    if (specificId) {
        await showComplaintDetail(chatId, msg.from, specificId);
        return;
    }

    // List all complaints
    const complaints = await db.all(
        "SELECT id, status, assigned_department, created_at, text FROM complaints WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
        [user.id]
    );

    if (complaints.length === 0) {
        bot.sendMessage(
            chatId,
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📭  *NO COMPLAINTS FOUND*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `You haven't filed any complaints yet.\n` +
            `Tap below to file your first one!`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📝  File a Complaint", callback_data: "action_complain" }],
                    ],
                },
            }
        );
        return;
    }

    const statusEmoji = { pending: "🟡", in_progress: "🔵", resolved: "🟢" };
    const statusLabel = { pending: "Pending", in_progress: "In Progress", resolved: "Resolved" };

    let message =
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📋  *YOUR COMPLAINTS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const c of complaints) {
        const emoji = statusEmoji[c.status] || "⚪";
        const label = statusLabel[c.status] || c.status;
        const shortText = c.text?.substring(0, 40) + (c.text?.length > 40 ? "…" : "");
        message += `${emoji}  *${c.id}*  ·  ${label}\n`;
        message += `      _${shortText}_\n`;
        message += `      🏢  ${c.assigned_department || "Unassigned"}\n\n`;
    }

    // Build inline buttons for each complaint
    const buttons = complaints.map((c) => [
        { text: `🔍  ${c.id}`, callback_data: `status_${c.id}` },
    ]);
    buttons.push([
        { text: "📝  File New Complaint", callback_data: "action_complain" },
    ]);

    bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons },
    });
}

// ═══════════════════════════════════════════════════════
//  COMPLAINT DETAIL VIEW
// ═══════════════════════════════════════════════════════

async function showComplaintDetail(chatId, from, complaintId) {
    const db = await getDb();
    const user = await db.get("SELECT id FROM users WHERE telegram_chat_id = ?", [
        String(chatId),
    ]);
    if (!user) return;

    const complaint = await db.get(
        "SELECT * FROM complaints WHERE id = ? AND user_id = ?",
        [complaintId, user.id]
    );

    if (!complaint) {
        bot.sendMessage(chatId, `❌  _Complaint *${complaintId}* not found._`, {
            parse_mode: "Markdown",
        });
        return;
    }

    const analysis = complaint.analysis ? JSON.parse(complaint.analysis) : {};
    const statusEmoji = { pending: "🟡", in_progress: "🔵", resolved: "🟢" };
    const statusLabel = { pending: "Pending", in_progress: "In Progress", resolved: "Resolved" };
    const priorityEmoji = { high: "🔴", medium: "🟠", low: "🟢" };

    const emoji = statusEmoji[complaint.status] || "⚪";
    const label = statusLabel[complaint.status] || complaint.status;
    const pEmoji = priorityEmoji[analysis.priority] || "⚪";
    const catLabel = CATEGORY_LABELS[analysis.category] || analysis.category || "N/A";
    const date = new Date(complaint.created_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });

    bot.sendMessage(
        chatId,
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📋  *COMPLAINT DETAILS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🆔  *ID:*  \`${complaint.id}\`\n` +
        `${emoji}  *Status:*  ${label}\n` +
        `${pEmoji}  *Priority:*  ${(analysis.priority || "N/A").toUpperCase()}\n` +
        `📂  *Category:*  ${catLabel}\n` +
        `🏢  *Department:*  ${complaint.assigned_department || "N/A"}\n` +
        `📅  *Filed:*  ${date}\n\n` +
        `━━━  *Description*  ━━━\n\n` +
        `_${complaint.text || "No description"}_\n\n` +
        `${complaint.notes ? `━━━  *Notes*  ━━━\n\n_${complaint.notes}_` : ""}`,
        {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "◀️  Back to List", callback_data: "action_status" },
                        { text: "🏠  Main Menu", callback_data: "action_help" },
                    ],
                ],
            },
        }
    );
}

// ═══════════════════════════════════════════════════════
//  /help — HELP & INFO
// ═══════════════════════════════════════════════════════

async function handleHelp(msg) {
    bot.sendMessage(
        msg.chat.id,
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `ℹ️  *HELP & INFORMATION*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🏛️  *Citizen Connect Bot* allows you to\n` +
        `interact with the grievance portal directly\n` +
        `from Telegram.\n\n` +
        `*Available actions:*\n\n` +
        `  📝  *File a Complaint*\n` +
        `       Describe your issue, share your\n` +
        `       location, and optionally attach a photo.\n\n` +
        `  📋  *My Complaints*\n` +
        `       View all your filed complaints and\n` +
        `       their current status.\n\n` +
        `  🗳️  *Community Polls*\n` +
        `       When a complaint is filed near you,\n` +
        `       you may receive a poll. If 3+ people\n` +
        `       confirm the issue, its priority is\n` +
        `       automatically raised.\n\n` +
        `  🔔  *Notifications*\n` +
        `       You'll receive messages when your\n` +
        `       complaint status is updated.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_You can also type commands:_\n` +
        `/complain · /status · /help`,
        {
            parse_mode: "Markdown",
            reply_markup: mainMenuKeyboard(),
        }
    );
}

// ═══════════════════════════════════════════════════════
//  LOCATION HANDLER (complaint step 3)
// ═══════════════════════════════════════════════════════

async function handleLocation(msg) {
    const chatId = msg.chat.id;
    const conv = conversations.get(chatId);

    if (!conv || conv.step !== "awaiting_location") return;

    const { latitude, longitude } = msg.location;

    conv.data.latitude = latitude;
    conv.data.longitude = longitude;
    conv.data.location = {
        city: "Location shared",
        state: "via Telegram",
        latitude,
        longitude,
    };

    // Move to complaint creation
    await createComplaintFromBot(chatId, conv.data);
    conversations.delete(chatId);
}

// ═══════════════════════════════════════════════════════
//  PHOTO HANDLER (complaint step — optional image)
// ═══════════════════════════════════════════════════════

async function handlePhoto(msg) {
    const chatId = msg.chat.id;
    const conv = conversations.get(chatId);

    if (!conv || conv.step !== "awaiting_image") return;

    // Get the highest resolution photo
    const photos = msg.photo;
    const bestPhoto = photos[photos.length - 1];

    try {
        const fileLink = await bot.getFileLink(bestPhoto.file_id);
        conv.data.image = fileLink;

        bot.sendMessage(
            chatId,
            `✅  *Photo received!*\n\n` +
            `Now let's get your location.\n\n` +
            `*Step 3 of 3* — Share your location\n\n` +
            `Tap the button below to share where\nthis issue is happening:`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    keyboard: [
                        [{ text: "📍  Share My Location", request_location: true }],
                        [{ text: "❌  Cancel Complaint" }],
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            }
        );

        conv.step = "awaiting_location";
    } catch (err) {
        console.error("Error getting photo link:", err.message);
        bot.sendMessage(chatId, "⚠️  _Couldn't process the photo. You can skip it._", {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⏭️  Skip Photo", callback_data: "skip_image" }],
                    [{ text: "❌  Cancel", callback_data: "cancel_complaint" }],
                ],
            },
        });
    }
}

// ═══════════════════════════════════════════════════════
//  SKIP IMAGE HANDLER
// ═══════════════════════════════════════════════════════

async function handleSkipImage(chatId) {
    const conv = conversations.get(chatId);
    if (!conv || conv.step !== "awaiting_image") return;

    conv.step = "awaiting_location";

    bot.sendMessage(
        chatId,
        `*Step 3 of 3* — Share your location\n\n` +
        `Tap the button below to share where\nthis issue is happening:`,
        {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [
                    [{ text: "📍  Share My Location", request_location: true }],
                    [{ text: "❌  Cancel Complaint" }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        }
    );
}

// ═══════════════════════════════════════════════════════
//  GENERIC MESSAGE HANDLER (multi-step flows)
// ═══════════════════════════════════════════════════════

async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const conv = conversations.get(chatId);

    if (!conv) return;
    if (msg.text?.startsWith("/")) return;
    if (msg.location) return;
    if (msg.photo) return;

    // Cancel button from reply keyboard
    if (msg.text === "❌  Cancel Complaint") {
        conversations.delete(chatId);
        bot.sendMessage(chatId, "🚫  _Complaint cancelled._", {
            parse_mode: "Markdown",
            reply_markup: { remove_keyboard: true },
        });
        sendMainMenu(chatId);
        return;
    }

    // ── Step 1: Complaint text ──
    if (conv.step === "awaiting_text") {
        const text = msg.text;
        if (!text || text.length < 5) {
            bot.sendMessage(
                chatId,
                "⚠️  _Please provide a more detailed description\n(at least a few words)._",
                { parse_mode: "Markdown" }
            );
            return;
        }

        conv.data.text = text;
        conv.step = "awaiting_image";

        bot.sendMessage(
            chatId,
            `✅  *Description saved!*\n\n` +
            `*Step 2 of 3* — Attach a photo _(optional)_\n\n` +
            `If you have a photo of the issue (pothole,\n` +
            `broken pipe, garbage, etc.), send it now.\n\n` +
            `Otherwise, tap *Skip* to continue.`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "⏭️  Skip Photo", callback_data: "skip_image" }],
                        [{ text: "❌  Cancel", callback_data: "cancel_complaint" }],
                    ],
                },
            }
        );
    }
    // ── Step 3: Waiting for location ──
    else if (conv.step === "awaiting_location") {
        bot.sendMessage(
            chatId,
            "⚠️  _Please use the *Share My Location* button\nbelow, or tap Cancel._",
            { parse_mode: "Markdown" }
        );
    }
}

// ═══════════════════════════════════════════════════════
//  CREATE COMPLAINT FROM BOT
// ═══════════════════════════════════════════════════════

async function createComplaintFromBot(chatId, data) {
    try {
        bot.sendMessage(chatId, "🧠  _Analyzing your complaint with AI…_", {
            parse_mode: "Markdown",
            reply_markup: { remove_keyboard: true },
        });

        const analysis = await analyzeGrievance(data.text);

        const db = await getDb();

        // Generate ID
        const latestRecord = await db.get(
            "SELECT id FROM complaints ORDER BY created_at DESC LIMIT 1"
        );
        const year = new Date().getFullYear();
        let nextNumber = 1;
        if (latestRecord?.id) {
            const match = latestRecord.id.match(/GRV-\d{4}-(\d+)/);
            if (match) nextNumber = parseInt(match[1], 10) + 1;
        }
        const id = `GRV-${year}-${String(nextNumber).padStart(3, "0")}`;

        const locationStr = JSON.stringify(data.location);
        const analysisStr = JSON.stringify({
            ...analysis,
            confidence: analysis.confidence || 0.9,
            keywords: analysis.keywords || [],
        });

        await db.run(
            `INSERT INTO complaints 
            (id, user_id, text, language, location, latitude, longitude, analysis, status, assigned_department, image, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.userId,
                data.text,
                "en",
                locationStr,
                data.latitude || null,
                data.longitude || null,
                analysisStr,
                "pending",
                analysis.suggestedDepartment,
                data.image || null,
                null,
            ]
        );

        const priorityEmoji = { high: "🔴", medium: "🟠", low: "🟢" };
        const pEmoji = priorityEmoji[analysis.priority] || "⚪";
        const catLabel = CATEGORY_LABELS[analysis.category] || analysis.category;

        bot.sendMessage(
            chatId,
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅  *COMPLAINT FILED!*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Your complaint has been received and\n` +
            `analysed by our AI system.\n\n` +
            `🆔  *Tracking ID:*  \`${id}\`\n\n` +
            `📂  *Category:*  ${catLabel}\n` +
            `${pEmoji}  *Priority:*  ${analysis.priority.toUpperCase()}\n` +
            `🏢  *Department:*  ${analysis.suggestedDepartment}\n` +
            `😐  *Sentiment:*  ${analysis.sentiment}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🔔  _You'll receive a notification when\n` +
            `the status of this complaint changes._`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: `🔍  View Details`, callback_data: `status_${id}` }],
                        [
                            { text: "📝  File Another", callback_data: "action_complain" },
                            { text: "🏠  Main Menu", callback_data: "action_help" },
                        ],
                    ],
                },
            }
        );

        // Trigger proximity poll
        if (data.latitude && data.longitude) {
            try {
                await triggerProximityPoll(id, data.latitude, data.longitude, data.text);
            } catch (err) {
                console.error("Proximity poll error (non-fatal):", err.message);
            }
        }
    } catch (error) {
        console.error("Error creating complaint from bot:", error);
        bot.sendMessage(
            chatId,
            "❌  _Failed to file complaint. Please try again._",
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔄  Try Again", callback_data: "action_complain" }],
                        [{ text: "🏠  Main Menu", callback_data: "action_help" }],
                    ],
                },
            }
        );
    }
}

// ═══════════════════════════════════════════════════════
//  POLL ANSWER HANDLER
// ═══════════════════════════════════════════════════════

async function handlePollAnswer(pollAnswer) {
    try {
        const db = await getDb();
        const telegramPollId = pollAnswer.poll_id;
        const userId = pollAnswer.user.id;
        const optionIds = pollAnswer.option_ids;

        if (!optionIds || optionIds.length === 0) return;

        const vote = optionIds[0] === 0 ? "yes" : "no";

        // Find the poll_vote record
        const pollVote = await db.get(
            "SELECT pv.*, p.id as poll_id, p.complaint_id FROM poll_votes pv JOIN polls p ON pv.poll_id = p.id WHERE pv.telegram_poll_id = ?",
            [telegramPollId]
        );

        if (!pollVote) {
            const user = await db.get(
                "SELECT id FROM users WHERE telegram_chat_id = ?",
                [String(userId)]
            );
            if (!user) return;

            const pendingVote = await db.get(
                "SELECT pv.*, p.complaint_id FROM poll_votes pv JOIN polls p ON pv.poll_id = p.id WHERE pv.user_id = ? AND pv.vote = 'no' ORDER BY pv.created_at DESC LIMIT 1",
                [user.id]
            );
            if (!pendingVote) return;

            await db.run("UPDATE poll_votes SET vote = ? WHERE id = ?", [vote, pendingVote.id]);

            if (vote === "yes") {
                await db.run("UPDATE polls SET yes_count = yes_count + 1 WHERE id = ?", [
                    pendingVote.poll_id,
                ]);
                const poll = await db.get("SELECT * FROM polls WHERE id = ?", [pendingVote.poll_id]);
                if (poll && poll.yes_count >= 3) {
                    await escalatePriority(poll.complaint_id);
                }
            }
            return;
        }

        await db.run("UPDATE poll_votes SET vote = ? WHERE id = ?", [vote, pollVote.id]);

        if (vote === "yes") {
            await db.run("UPDATE polls SET yes_count = yes_count + 1 WHERE id = ?", [pollVote.poll_id]);
        } else {
            await db.run("UPDATE polls SET no_count = no_count + 1 WHERE id = ?", [pollVote.poll_id]);
        }

        const poll = await db.get("SELECT * FROM polls WHERE id = ?", [pollVote.poll_id]);
        if (poll && poll.yes_count >= 3) {
            await escalatePriority(poll.complaint_id);
        }
    } catch (error) {
        console.error("Error handling poll answer:", error);
    }
}

// ═══════════════════════════════════════════════════════
//  PRIORITY ESCALATION
// ═══════════════════════════════════════════════════════

async function escalatePriority(complaintId) {
    try {
        const db = await getDb();
        const complaint = await db.get("SELECT * FROM complaints WHERE id = ?", [complaintId]);
        if (!complaint) return;

        const analysis = complaint.analysis ? JSON.parse(complaint.analysis) : {};
        if (analysis.priority === "high") return;

        analysis.priority = "high";
        await db.run("UPDATE complaints SET analysis = ? WHERE id = ?", [
            JSON.stringify(analysis),
            complaintId,
        ]);

        console.log(`🔺 Complaint ${complaintId} priority escalated to HIGH`);

        if (complaint.user_id) {
            const user = await db.get("SELECT telegram_chat_id FROM users WHERE id = ?", [
                complaint.user_id,
            ]);
            if (user?.telegram_chat_id && bot) {
                bot.sendMessage(
                    user.telegram_chat_id,
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `🔺  *PRIORITY ESCALATED*\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `Your complaint *${complaintId}* has been\n` +
                    `upgraded to *HIGH* priority! 🔴\n\n` +
                    `Multiple residents near you confirmed\n` +
                    `they face the same issue.`,
                    {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: `🔍  View Details`, callback_data: `status_${complaintId}` }],
                            ],
                        },
                    }
                );
            }
        }
    } catch (error) {
        console.error("Error escalating priority:", error);
    }
}

// ═══════════════════════════════════════════════════════
//  SEND NOTIFICATION (exported)
// ═══════════════════════════════════════════════════════

export async function sendTelegramNotification(chatId, message) {
    if (!bot || !chatId) return;
    try {
        await bot.sendMessage(chatId, message, {
            parse_mode: "Markdown",
            reply_markup: mainMenuKeyboard(),
        });
    } catch (error) {
        console.error(`Failed to send notification to ${chatId}:`, error.message);
    }
}

// ═══════════════════════════════════════════════════════
//  SEND POLL (exported)
// ═══════════════════════════════════════════════════════

export async function sendTelegramPoll(chatId, question, pollId, userId) {
    if (!bot || !chatId) return null;
    try {
        const sentPoll = await bot.sendPoll(chatId, question, ["Yes, I face this too", "No"], {
            is_anonymous: false,
        });

        const db = await getDb();
        await db.run(
            "INSERT INTO poll_votes (poll_id, user_id, vote, telegram_poll_id) VALUES (?, ?, 'no', ?)",
            [pollId, userId, sentPoll.poll.id]
        );

        return sentPoll;
    } catch (error) {
        console.error(`Failed to send poll to ${chatId}:`, error.message);
        return null;
    }
}
