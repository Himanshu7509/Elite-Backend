import express from "express";
import { createBimEnquiry,  getBimEnquiries, deleteBimEnquiry} from "../controllers/bim-equiryform.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const bimEnquiryRouter = express.Router();

bimEnquiryRouter.post("/create-form", createBimEnquiry);     
bimEnquiryRouter.get("/read-form",verifyToken, getBimEnquiries);       
bimEnquiryRouter.delete("/delete-form/:id",verifyToken, deleteBimEnquiry);

export default bimEnquiryRouter;