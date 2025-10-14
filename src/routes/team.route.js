import express from "express";
import {
  createTeamMember,
  getAllTeamMembers,
  deleteTeamMember,
} from "../controllers/team.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const TeamRouter = express.Router();

TeamRouter.post("/create", createTeamMember);
TeamRouter.get("/get-all",verifyToken, getAllTeamMembers);
TeamRouter.delete("/:id", deleteTeamMember);

export default TeamRouter;
