import express from "express";
import { 
  createEnrollment, 
  getAllEnrollments, 
  getEnrollmentById, 
  updateEnrollmentStatus, 
  updateEnrollmentDetails,
  deleteEnrollment,
  updateEducation,
  addRemark
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

// Update enrollment details
router.patch("/:id/details", updateEnrollmentDetails);

// Delete enrollment
router.delete("/:id", deleteEnrollment);

// Update education
router.put("/:id/education", updateEducation);

// Add remark
router.post("/:id/remark", addRemark);

export default router;