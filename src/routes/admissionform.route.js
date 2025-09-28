import express from "express";
import { 
  createAdmissionForm, 
  getAdmissionForms, 
  deleteAdmissionForm 
} from "../controllers/admissionform.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const admissionRouter = express.Router();

admissionRouter.post("/create-form", createAdmissionForm);
admissionRouter.get("/read-form",verifyToken, getAdmissionForms);
admissionRouter.delete("/delete-form/:id",verifyToken, deleteAdmissionForm);

export default admissionRouter;
