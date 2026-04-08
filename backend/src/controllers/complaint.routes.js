import express from "express";
import {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaintStatus,
} from "../controllers/complaint.controller.js";

const router = express.Router();

router.post("/", createComplaint);
router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.patch("/:id", updateComplaintStatus);

export default router;
