import express from "express";
import { 
  createEnrollment, 
  getAllEnrollments, 
  getEnrollmentById, 
  updateEnrollmentStatus, 
  deleteEnrollment 
} from "../controllers/enrollment.controller.js";

const router = express.Router();

// Create a new enrollment
router.post("/create", createEnrollment);

// Get all enrollments
router.get("/get-all", getAllEnrollments);

// Get enrollment by ID
router.get("/:id", getEnrollmentById);

// Update enrollment status
router.patch("/:id/status", updateEnrollmentStatus);

// Delete enrollment
router.delete("/:id", deleteEnrollment);

export default router;