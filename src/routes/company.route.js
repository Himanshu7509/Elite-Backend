import express from "express";
import { importCompanies, getAllCompanies, getCompanyById, deleteAllCompanies, deleteCompany, updateCompany } from "../controllers/company.controller.js";
import multer from "multer";
import { hasReadAccess, isAdmin } from "../middleware/role.middleware.js";

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
router.post("/import", isAdmin, upload.none(), importCompanies);

// For file uploads
router.post("/import/file", isAdmin, upload.single('file'), importCompanies);

router.get("/all", hasReadAccess, getAllCompanies);

// Get company by ID
router.get("/:id", hasReadAccess, getCompanyById);

// Add the new delete all endpoint
router.delete("/all", isAdmin, deleteAllCompanies);

// Add delete single company endpoint
router.delete("/:id", isAdmin, deleteCompany);

// Add update company endpoint
router.put("/:id", isAdmin, updateCompany);

export default router;