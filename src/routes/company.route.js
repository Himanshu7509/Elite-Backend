import express from "express";
import { importCompanies, getAllCompanies } from "../controllers/company.controller.js";
import multer from "multer";

const router = express.Router();
const upload = multer();

// For JSON data
router.post("/import", upload.none(), importCompanies);

// For file uploads
router.post("/import/file", upload.single('file'), importCompanies);

router.get("/all", getAllCompanies);

export default router;