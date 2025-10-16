import express from "express";
import { sendSingleMail, sendGroupMail } from "../controllers/mail.contoller.js";

const mailRouter = express.Router();

mailRouter.post("/send-single", sendSingleMail);
mailRouter.post("/send-group", sendGroupMail);

export default mailRouter;
