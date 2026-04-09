import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import complaintRoutes from "./routes/complaints.routes.js";
import userRoutes from "./routes/users.routes.js";
import { initTelegramBot, getBot, setupWebhook } from "./services/telegram.service.js";

const app = express();

app.use(
    cors({
        origin: true,
        credentials: true,
    }),
);

/* -----------------------------
   Body parsing
   ----------------------------- */
app.use(express.json({ limit: "10mb" }));

/* -----------------------------
   API routes
   ----------------------------- */
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);

// ── Telegram webhook endpoint ──
// Telegram sends POST updates here
app.post("/api/telegram-webhook", (req, res) => {
    try {
        // Ensure bot is initialized with handlers
        const bot = getBot();
        if (bot) {
            bot.processUpdate(req.body);
        } else {
            console.error("⚠️ Bot not available for webhook processing");
        }
    } catch (err) {
        console.error("Webhook processing error:", err.message);
    }
    // Always respond 200 quickly so Telegram doesn't retry
    res.sendStatus(200);
});

// ── Telegram webhook setup endpoint ──
// Call this once after deployment: POST /api/telegram-setup
app.post("/api/telegram-setup", async (req, res) => {
    try {
        // Determine the backend URL
        let backendUrl = req.body?.backendUrl;
        if (!backendUrl) {
            // Auto-detect from the request
            const proto = req.headers["x-forwarded-proto"] || req.protocol;
            const host = req.headers["x-forwarded-host"] || req.headers.host;
            backendUrl = `${proto}://${host}`;
        }

        const result = await setupWebhook(backendUrl);
        res.json(result);
    } catch (error) {
        console.error("Webhook setup error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── Check current webhook status ──
app.get("/api/telegram-setup", async (req, res) => {
    try {
        const bot = getBot();
        if (!bot) {
            return res.json({ error: "Bot not initialized" });
        }
        const info = await bot.getWebHookInfo();
        res.json({ webhook: info });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* -----------------------------
   Health check
   ----------------------------- */
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

/* -----------------------------
   Root
   ----------------------------- */
app.get("/", (req, res) => {
    res.json({
        message: "Citizen Connect Backend is running",
        environment: process.env.NODE_ENV || "development",
    });
});

/* -----------------------------
   Start server (local dev only)
   Vercel handles this via serverless
   ----------------------------- */
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ Backend running on port ${PORT}`);

        // Initialize Telegram bot (polling mode for local dev)
        try {
            initTelegramBot();
        } catch (err) {
            console.error(
                "⚠️ Telegram bot initialization failed:",
                err.message,
            );
        }
    });
} else {
    // On Vercel: init bot in webhook mode
    // The bot will be auto-initialized on first getBot() call
    // but we can initialize eagerly here too
    try {
        initTelegramBot();
    } catch (err) {
        console.error("⚠️ Telegram bot initialization failed:", err.message);
    }
}

// Export for Vercel serverless
export default app;
