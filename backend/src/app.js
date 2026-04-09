import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import complaintRoutes from "./routes/complaints.routes.js";
import userRoutes from "./routes/users.routes.js";
import { initTelegramBot } from "./services/telegram.service.js";

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

// Webhook for Serverless environment
app.post("/api/telegram-webhook", (req, res) => {
    import("./services/telegram.service.js").then(({ getBot }) => {
        const bot = getBot();
        if (bot) bot.processUpdate(req.body);
    }).catch(console.error);
    res.sendStatus(200);
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
    // On Vercel: init bot in webhook mode (if configured)
    try {
        initTelegramBot();
    } catch (err) {
        console.error("⚠️ Telegram bot initialization failed:", err.message);
    }
}

// Export for Vercel serverless
export default app;
