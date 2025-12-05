import Company from "../models/company.model.js";
import * as XLSX from 'xlsx';

// Import companies from JSON data or file
export const importCompanies = async (req, res) => {
  try {
    let companiesData = [];

    // Check if we're receiving file upload
    if (req.file) {
      // Process uploaded Excel file
      try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        companiesData = XLSX.utils.sheet_to_json(worksheet);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Failed to parse Excel file. Please make sure it's a valid Excel file.",
          error: error.message
        });
      }
    } else {
      // Process JSON data from request body
      companiesData = req.body.companies || req.body;
    }

    // Validate data
    if (!Array.isArray(companiesData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Expected an array of company objects."
      });
    }

    if (companiesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided. Please provide company data to import."
      });
    }

    // Filter out empty or invalid records
    const validCompaniesData = companiesData.filter(company => {
      // Check if the company object has meaningful data
      // (more than just default fields like _id, __v, createdAt, updatedAt)
      const keys = Object.keys(company);
      const meaningfulKeys = keys.filter(key => 
        !['_id', '__v', 'createdAt', 'updatedAt'].includes(key) && 
        company[key] !== null && 
        company[key] !== undefined &&
        company[key] !== ''
      );
      
      return meaningfulKeys.length > 0;
    });

    if (validCompaniesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid company data found. All records appear to be empty."
      });
    }

    // Insert new data
    const result = await Company.insertMany(validCompaniesData);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.length} companies`,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error("Error importing companies:", error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate company data detected. Please check your data for duplicates.",
        error: error.message
      });
    }
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Data validation failed. Please check your data format.",
        error: Object.values(error.errors).map(val => val.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to import companies",
      error: error.message
    });
  }
};

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    // Find all companies and filter out empty records
    const allCompanies = await Company.find().sort({ createdAt: -1 });
    
    // Filter out empty records (those with only default fields)
    const companies = allCompanies.filter(company => {
      const keys = Object.keys(company.toObject());
      const meaningfulKeys = keys.filter(key => 
        !['_id', '__v', 'createdAt', 'updatedAt'].includes(key) && 
        company[key] !== null && 
        company[key] !== undefined &&
        company[key] !== ''
      );
      
      return meaningfulKeys.length > 0;
    });

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
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

// Delete all companies
export const deleteAllCompanies = async (req, res) => {
  try {
    const deleteResult = await Company.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} companies`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error("Error deleting companies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete companies",
      error: error.message
    });
  }
};

// Helper function to normalize column names (remove extra spaces, special chars)
const normalizeColumnName = (name) => {
  return name.toString().trim().replace(/\s+/g, ' ');
};

// Helper function to find value by trying different column name variations
const findColumnValue = (row, ...possibleNames) => {
  // First try exact match
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }

  // If not found, try normalized matching
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const normalizedSearch = normalizeColumnName(name).toLowerCase();
    for (const key of rowKeys) {
      const normalizedKey = normalizeColumnName(key).toLowerCase();
      if (normalizedKey === normalizedSearch) {
        return row[key];
      }
    }
  }

  return null;
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

    // Read the Excel file with options to handle various formats
    const workbook = xlsx.read(req.file.buffer, {
      type: 'buffer',
      cellDates: true,
      cellText: false
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with defval to handle empty cells
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

    console.log("===========================================");
    console.log("Excel Import Debug Information");
    console.log("===========================================");
    console.log("Total rows found:", jsonData.length);

    if (jsonData.length > 0) {
      const columns = Object.keys(jsonData[0]);
      console.log("\nActual column names found:");
      columns.forEach((col, index) => {
        console.log(`  ${index + 1}. "${col}" (length: ${col.length})`);
      });

      console.log("\nFirst row data sample:");
      console.log(JSON.stringify(jsonData[0], null, 2));
    }
    console.log("===========================================\n");

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
        // Try to find values with multiple possible column name variations
        const jobTitle = findColumnValue(row,
          'Job Title', 'job title', 'JobTitle', 'Title', 'Position'
        );

        const companyName = findColumnValue(row,
          'Company Name', 'company name', 'CompanyName', 'Company'
        );

        const category = findColumnValue(row,
          'Category', 'category', 'Job Category', 'job category'
        );

        const location = findColumnValue(row,
          'Location', 'location', 'Locations', 'City'
        );

        // Debug log for first row
        if (i === 0) {
          console.log("Extracted values from first row:");
          console.log("  Job Title:", jobTitle);
          console.log("  Company Name:", companyName);
          console.log("  Category:", category);
          console.log("  Location:", location);
        }

        // Basic validation
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

        // Extract other fields
        const jobType = findColumnValue(row, 'Job Type', 'job type', 'JobType');
        const experienceLevel = findColumnValue(row, 'Experience Level', 'experience level', 'Experience');
        const salaryMin = findColumnValue(row, 'Salary Min (₹)', 'Salary Min', 'salary min');
        const salaryMax = findColumnValue(row, 'Salary Max (₹)', 'Salary Max', 'salary max');
        const minEducation = findColumnValue(row, 'Min Education', 'min education', 'Education');
        const openings = findColumnValue(row, 'Openings', 'openings', 'Number of Openings');
        const noticePeriod = findColumnValue(row, 'Notice Period', 'notice period', 'NoticePeriod');
        const yearOfPassing = findColumnValue(row, 'Year of Passing', 'year of passing', 'Passing Year');
        const workType = findColumnValue(row, 'Work Type', 'work type', 'WorkType');
        const interviewType = findColumnValue(row, 'Interview Type', 'interview type', 'InterviewType');
        const companyWebsite = findColumnValue(row, 'Company Website', 'company website', 'Website');
        const companyDescription = findColumnValue(row, 'Company Description', 'company description');
        const jobDescription = findColumnValue(row, 'Job Description', 'job description', 'Description');

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

    console.log(`\nProcessing Summary:`);
    console.log(`  Total rows: ${jsonData.length}`);
    console.log(`  Valid companies: ${companiesToInsert.length}`);
    console.log(`  Errors: ${errors.length}`);

    // Insert all valid companies
    let insertedCompanies = [];
    if (companiesToInsert.length > 0) {
      try {
        insertedCompanies = await Company.insertMany(companiesToInsert, { ordered: false });
        console.log(`Successfully inserted ${insertedCompanies.length} companies into database`);
      } catch (insertError) {
        console.error("Error inserting companies:", insertError);
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
