import AdmissionForm from "../models/admissionform.model.js";
import dbConnect from "../utils/mongodb.js";

// Create a new admission form (POST)
export const createAdmissionForm = async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const admissionData = new AdmissionForm(req.body);
    const savedAdmission = await admissionData.save();
    res.status(201).json(savedAdmission);
  } catch (error) {
    console.error("Error creating admission form:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Get all admission forms (GET)
export const getAdmissionForms = async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const admissions = await AdmissionForm.find();
    res.status(200).json(admissions);
  } catch (error) {
    console.error("Error fetching admission forms:", error.message);
    res.status(500).json({ 
      message: "Failed to fetch admission forms",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete an admission form by ID (DELETE)
export const deleteAdmissionForm = async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const { id } = req.params;
    const deletedAdmission = await AdmissionForm.findByIdAndDelete(id);

    if (!deletedAdmission) {
      return res.status(404).json({ message: "Admission form not found" });
    }

    res.status(200).json({ message: "Admission form deleted successfully" });
  } catch (error) {
    console.error("Error deleting admission form:", error.message);
    res.status(500).json({ message: error.message });
  }
};