import express from "express";
import { createTeamMember, getAllTeamMembers, updateTeamMember, deleteTeamMember, getTeamMemberById } from "../controllers/team.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new team member
router.post("/create", verifyToken, createTeamMember);

// Get all team members
router.get("/get-all", verifyToken, getAllTeamMembers);

// Get team member by ID
router.get("/:id", verifyToken, getTeamMemberById);

// Update a team member
router.put("/:id", verifyToken, updateTeamMember);

// Delete a team member
router.delete("/:id", verifyToken, deleteTeamMember);

export default router;