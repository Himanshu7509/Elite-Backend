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
    
    console.log("Excel data received:", jsonData.length, "rows");
    
    // Log the first row to see actual column names
    if (jsonData.length > 0) {
      console.log("First row columns:", Object.keys(jsonData[0]));
      console.log("First row sample:", jsonData[0]);
    }
    
    // Process and validate data
    const companiesToInsert = [];
    const errors = [];
    
    // Parse location (comma separated)
    const parseLocation = (location) => {
      if (!location) return [];
      return location.toString()
        .split(',')
        .map(loc => loc.trim())
        .filter(loc => loc.length > 0);
    };
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // Extract values using exact column names from your Excel
        const jobTitle = row['Job Title'];
        const companyName = row['Company Name'];
        const jobType = row['Job Type'];
        const location = row['Location'];
        const experienceLevel = row['Experience Level'];
        const salaryMin = row['Salary Min (₹)'];
        const salaryMax = row['Salary Max (₹)'];
        const minEducation = row['Min Education'];
        const category = row['Category'];
        const openings = row['Openings'];
        const noticePeriod = row['Notice Period'];
        const yearOfPassing = row['Year of Passing'];
        const workType = row['Work Type'];
        const interviewType = row['Interview Type'];
        const companyWebsite = row['Company Website'];
        const companyDescription = row['Company Description'];
        const jobDescription = row['Job Description'];
        
        // Basic validation - check for required fields
        if (!jobTitle || !companyName || !category) {
          const missingFields = [];
          if (!jobTitle) missingFields.push('Job Title');
          if (!companyName) missingFields.push('Company Name');
          if (!category) missingFields.push('Category');
          
          errors.push(`Row ${i + 2}: Missing required fields: ${missingFields.join(', ')}`);
          continue;
        }
        
        // Parse location
        const locationArray = parseLocation(location);
        
        if (locationArray.length === 0) {
          errors.push(`Row ${i + 2}: Location is required`);
          continue;
        }
        
        // Create company data object
        const companyData = {
          title: jobTitle.toString().trim(),
          description: jobDescription ? jobDescription.toString().trim() : 'No description provided',
          company: {
            name: companyName.toString().trim(),
            description: companyDescription ? companyDescription.toString().trim() : '',
            website: companyWebsite ? companyWebsite.toString().trim() : ''
          },
          location: locationArray,
          jobType: jobType ? jobType.toString().trim() : '',
          experienceLevel: experienceLevel ? experienceLevel.toString().trim() : '',
          salary: {
            min: salaryMin ? salaryMin.toString().trim() : '',
            max: salaryMax ? salaryMax.toString().trim() : '',
            currency: 'INR'
          },
          minEducation: minEducation ? minEducation.toString().trim() : '',
          category: category.toString().trim(),
          numberOfOpenings: openings ? parseInt(openings) : null,
          noticePeriod: noticePeriod ? noticePeriod.toString().trim() : '',
          yearOfPassing: yearOfPassing ? yearOfPassing.toString().trim() : '',
          directLink: companyWebsite ? companyWebsite.toString().trim() : '',
          workType: workType ? workType.toString().trim() : '',
          interviewType: interviewType ? interviewType.toString().trim() : '',
          requirements: [],
          responsibilities: [],
          skills: []
        };
        
        companiesToInsert.push(companyData);
        
      } catch (rowError) {
        errors.push(`Row ${i + 2}: Error processing row - ${rowError.message}`);
        console.error(`Error processing row ${i + 2}:`, rowError);
      }
    }
    
    console.log(`Processed ${jsonData.length} rows. Valid companies: ${companiesToInsert.length}, Errors: ${errors.length}`);
    
    // Insert all valid companies
    let insertedCompanies = [];
    if (companiesToInsert.length > 0) {
      try {
        insertedCompanies = await Company.insertMany(companiesToInsert, { ordered: false });
        console.log(`Successfully inserted ${insertedCompanies.length} companies`);
      } catch (insertError) {
        console.error("Error inserting companies:", insertError);
        // If some companies were inserted before error
        if (insertError.insertedDocs) {
          insertedCompanies = insertError.insertedDocs;
        }
        errors.push(`Database insertion error: ${insertError.message}`);
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: `Successfully imported ${insertedCompanies.length} companies out of ${jsonData.length} rows`,
      data: insertedCompanies,
      errors: errors,
      summary: {
        totalRows: jsonData.length,
        successful: insertedCompanies.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error("Error importing companies from Excel:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to import companies from Excel",
      error: error.message,
      stack: error.stack
    });
  }
};