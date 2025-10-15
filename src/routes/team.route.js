import express from "express";
import {
  createTeamMember,
  getAllTeamMembers,
  deleteTeamMember,
  getTeamMemberById,
} from "../controllers/team.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const TeamRouter = express.Router();

TeamRouter.post("/create", verifyToken, createTeamMember);
TeamRouter.get("/get-all", verifyToken, getAllTeamMembers);
TeamRouter.get("/:id", verifyToken, getTeamMemberById);
TeamRouter.delete("/:id", verifyToken, deleteTeamMember);

export default TeamRouter;