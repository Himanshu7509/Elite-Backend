import express from "express";
import { createForm, getForms, deleteForm } from "../controllers/form.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const formRouter = express.Router();

formRouter.post("/create-form", createForm);     
formRouter.get("/read-form",verifyToken, getForms);       
formRouter.delete("/delete-form/:id",verifyToken, deleteForm);

export default formRouter;
