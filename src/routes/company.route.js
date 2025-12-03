import express from "express";
import { 
  createCompany, 
  getAllCompanies, 
  getCompanyById, 
  updateCompany, 
  deleteCompany,
  importCompaniesFromExcel,
  upload
} from "../controllers/company.controller.js";

const router = express.Router();

// Create a new company
router.post("/create", createCompany);

// Get all companies
router.get("/get-all", getAllCompanies);

// Get company by ID
router.get("/:id", getCompanyById);

// Update company
router.put("/:id", updateCompany);

// Delete company
router.delete("/:id", deleteCompany);

// Import companies from Excel
router.post("/import", upload.single('excelFile'), importCompaniesFromExcel);

export default router;