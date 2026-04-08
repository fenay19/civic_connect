import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import complaintRoutes from "./routes/complaints.routes.js";
import userRoutes from "./routes/users.routes.js";

const app = express();

/* -----------------------------
   CORS (LOCAL DEV FOR NOW)
   ----------------------------- */
app.use(
    cors({
        origin: [
            "http://localhost:8080",
            "http://localhost:5173",
            "http://localhost:3000",
        ],
        credentials: true,
    })
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

/* -----------------------------
   Health check
   ----------------------------- */
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

/* -----------------------------
   Root (API only)
   ----------------------------- */
app.get("/", (req, res) => {
    res.json({
        message: "Citizen Connect Backend is running",
        environment: process.env.NODE_ENV || "development",
    });
});

/* -----------------------------
   Start server (Render)
   ----------------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Backend running on port ${PORT}`);
});
