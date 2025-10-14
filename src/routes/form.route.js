import express from "express";
import {
  createForm,
  getForms,
  markAsRead,
  updateStatus,
  assignLead,
  updateFormDetails
} from "../controllers/form.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const formRouter = express.Router();

formRouter.post("/create-form", createForm);
formRouter.get("/read-form", verifyToken, getForms);
formRouter.patch("/update/:id", updateFormDetails);
formRouter.patch("/:id/read", verifyToken, markAsRead);
formRouter.patch("/:id/status", verifyToken, updateStatus);
formRouter.patch("/:id/assign", verifyToken, assignLead);

export default formRouter;
