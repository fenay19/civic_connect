import express from "express";
import {
    getComplaints,
    createComplaint,
    updateComplaintStatus,
    getComplaintById,
    triggerPoll,
    getPollResults,
} from "../controllers/complaints.controller.js";

const router = express.Router();

router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.post("/", createComplaint);
router.patch("/:id", updateComplaintStatus);

// Admin poll endpoints
router.post("/:id/poll", triggerPoll);
router.get("/:id/poll", getPollResults);

export default router;
