import Company from "../models/company.model.js";
import multer from "multer";
import xlsx from "xlsx";

// Configure multer for file upload
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const companyData = req.body;
    
    const newCompany = new Company(companyData);
    await newCompany.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Company created successfully",
      data: newCompany 
    });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create company",
      error: error.message 
    });
  }
};

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: companies,
      count: companies.length
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch companies",
      error: error.message 
    });
  }
};

// Get company by ID
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: company 
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch company",
      error: error.message 
    });
  }
};

// Update company
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const company = await Company.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Company updated successfully",
      data: company 
    });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update company",
      error: error.message 
    });
  }
};

// Delete company
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Company deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete company",
      error: error.message 
    });
  }
};

// Import companies from Excel file
export const importCompaniesFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    // Read the Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    
    console.log("Excel data received:", jsonData);
    
    // Process and validate data
    const companiesToInsert = [];
    const errors = [];
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Log the row for debugging
      console.log(`Processing row ${i + 1}:`, row);
      
      // Get the required fields using the actual column names from your Excel file
      const jobTitle = row['Job Title'] || '';
      const companyName = row['Company Name'] || '';
      
      // Basic validation - check for required fields
      if (!jobTitle || !companyName) {
        // Log what we found for debugging
        errors.push(`Row ${i + 1}: Missing required fields. Found Job Title: "${jobTitle}", Company Name: "${companyName}"`);
        continue;
      }
      
      // Parse requirements and responsibilities (split by newline or comma)
      const parseArrayField = (field) => {
        if (!field) return [];
        // Split by newline or comma and trim each item
        return field.toString()
          .split(/[\n,]+/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      };
      
      // Parse skills (comma separated)
      const parseSkills = (skills) => {
        if (!skills) return [];
        return skills.toString()
          .split(',')
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
      };
      
      // Parse location (comma separated)
      const parseLocation = (location) => {
        if (!location) return [];
        return location.toString()
          .split(',')
          .map(loc => loc.trim())
          .filter(loc => loc.length > 0);
      };
      
      // Map Excel columns to company fields using your actual column names
      const companyData = {
        title: jobTitle,
        description: row['Job Description'] || '',
        company: {
          name: companyName,
          description: row['Company Description'] || '',
          website: row['Company Website'] || ''
        },
        // Handle location as array
        location: parseLocation(row['Location'] || ''),
        jobType: row['Job Type'] || '',
        experienceLevel: row['Experience Level'] || '',
        salary: {
          min: row['Salary Min (₹)'] || '',
          max: row['Salary Max (₹)'] || '',
          currency: 'INR'
        },
        minEducation: row['Min Education'] || '',
        category: row['Category'] || '',
        numberOfOpenings: row['Openings'] ? parseInt(row['Openings']) : null,
        noticePeriod: row['Notice Period'] || '',
        yearOfPassing: row['Year of Passing'] || '',
        directLink: row['Company Website'] || '', // Using company website as direct link
        workType: row['Work Type'] || '',
        interviewType: row['Interview Type'] || '',
        // Handle array fields
        requirements: parseArrayField(row['Requirements'] || ''),
        responsibilities: parseArrayField(row['Responsibilities'] || ''),
        skills: parseSkills(row['Skills'] || '')
      };
      
      companiesToInsert.push(companyData);
    }
    
    console.log("Companies to insert:", companiesToInsert);
    
    // Insert all valid companies
    const insertedCompanies = await Company.insertMany(companiesToInsert);
    
    res.status(201).json({ 
      success: true, 
      message: `Successfully imported ${insertedCompanies.length} companies`,
      data: insertedCompanies,
      errors: errors
    });
  } catch (error) {
    console.error("Error importing companies from Excel:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to import companies from Excel",
      error: error.message 
    });
  }
};