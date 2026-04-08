import express from "express";
import {
    getComplaints,
    createComplaint,
    updateComplaintStatus,
    getComplaintById,
} from "../controllers/complaints.controller.js";

const router = express.Router();

router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.post("/", createComplaint);
router.patch("/:id", updateComplaintStatus);

export default router;
