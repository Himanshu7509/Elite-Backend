import express from "express";
import { importCompanies, getAllCompanies } from "../controllers/company.controller.js";
import multer from "multer";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// For JSON data
router.post("/import", upload.none(), importCompanies);

// For file uploads
router.post("/import/file", upload.single('file'), importCompanies);

router.get("/all", getAllCompanies);

export default router;