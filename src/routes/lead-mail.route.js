import express from "express";
import { 
  sendSingleMail, 
  sendGroupMail, 
  uploadFiles,
  getSentMails,
  getSentMailById
} from "../controllers/mail.contoller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const mailRouter = express.Router();

// Apply file upload middleware to routes that need it
mailRouter.post("/send-single", verifyToken, uploadFiles.array('attachments', 5), sendSingleMail);
mailRouter.post("/send-group", verifyToken, uploadFiles.array('attachments', 5), sendGroupMail);

// GET routes for tracking sent emails
mailRouter.get("/", verifyToken, getSentMails);
mailRouter.get("/:id", verifyToken, getSentMailById);

export default mailRouter;