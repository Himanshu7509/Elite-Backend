import express from "express";
import { importCompanies, getAllCompanies, getCompanyById, deleteAllCompanies, deleteCompany, updateCompany } from "../controllers/company.controller.js";
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

// Get company by ID
router.get("/:id", getCompanyById);

// Add the new delete all endpoint
router.delete("/all", deleteAllCompanies);

// Add delete single company endpoint
router.delete("/:id", deleteCompany);

// Add update company endpoint
router.put("/:id", updateCompany);

export default router;