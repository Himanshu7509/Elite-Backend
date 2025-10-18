import express from "express";
import { sendSingleMail, sendGroupMail, uploadFiles } from "../controllers/mail.contoller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const mailRouter = express.Router();

mailRouter.post("/send-single", verifyToken, uploadFiles.array('attachments', 5), sendSingleMail);
mailRouter.post("/send-group", verifyToken, uploadFiles.array('attachments', 5), sendGroupMail);

export default mailRouter;