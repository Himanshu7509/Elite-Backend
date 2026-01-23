import express from "express";
import {
  createForm,
  getForms,
  getAllForms,
  getUnassignedForms,
  getAssignedForms,
  getFormById,
  markAsRead,
  updateStatus,
  assignLead,
  updateFormDetails,
  deleteLead,
  updateEducation,
  addRemark,
  getLeadStats
} from "../controllers/form.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { optionalAuth } from "../middleware/optionalAuth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const formRouter = express.Router();

// Middleware to handle file uploads
import { upload } from "../controllers/form.controller.js";

formRouter.post("/create-form", optionalAuth, upload.single("resume"), createForm);
formRouter.get("/read-form", verifyToken, getForms);
formRouter.get("/read-all-forms", verifyToken, getAllForms);
formRouter.get("/unassigned", verifyToken, getUnassignedForms);
formRouter.get("/assigned/:salesId", verifyToken, getAssignedForms);
formRouter.get("/form/:id", verifyToken, getFormById);
formRouter.patch("/update/:id", verifyToken, upload.single("resume"), updateFormDetails);
formRouter.patch("/:id/read", verifyToken, markAsRead);
formRouter.patch("/:id/status", verifyToken, updateStatus);
formRouter.patch("/:id/assign", verifyToken, assignLead);
formRouter.delete("/delete-form/:id", verifyToken, isAdmin, deleteLead);

// Route for updating education
formRouter.put("/update-education/:id", verifyToken, updateEducation);

// Route for adding remarks
formRouter.post("/add-remark/:id", verifyToken, addRemark);

// Route for lead statistics
formRouter.get("/stats", verifyToken, getLeadStats);

export default formRouter;