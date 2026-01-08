import express from "express";
import { 
  createReport, 
  getUserReports, 
  getReportById, 
  updateReport, 
  deleteReport, 
  getReportsByDateRange,
  upload 
} from "../controllers/report.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new report (requires authentication, allowed for admin, developer, analyst)
router.post("/", verifyToken, upload.array("files", 5), createReport);

// Get all reports for the authenticated user (requires authentication, allowed for admin, developer, analyst)
router.get("/", verifyToken, getUserReports);

// Get reports by date range (requires authentication, allowed for admin, developer, analyst)
router.get("/date-range", verifyToken, getReportsByDateRange);

// Get a specific report by ID (requires authentication, allowed for admin, developer, analyst)
router.get("/:id", verifyToken, getReportById);

// Update a report (requires authentication, allowed for admin, developer, analyst)
router.put("/:id", verifyToken, upload.array("files", 5), updateReport);

// Delete a report (requires authentication, only admin can delete)
router.delete("/:id", verifyToken, deleteReport);

export default router;