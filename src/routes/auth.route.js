import express from "express";
import { login } from "../controllers/auth.controller.js";

const AuthRouter = express.Router();

AuthRouter.post("/login",login);

export default AuthRouter;
