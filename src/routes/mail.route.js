import express from "express";
import { sendSingleMail, sendGroupMail } from "../controllers/mailer.controller.js";

const mailRouter = express.Router();

// Send mail to single person
mailRouter.post("/send-single", sendSingleMail);

// Send mail to multiple people
mailRouter.post("/send-group", sendGroupMail);

export default mailRouter;