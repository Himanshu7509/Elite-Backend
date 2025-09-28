import AdmissionForm from "../models/admissionform.model.js";

// Create a new admission form (POST)
export const createAdmissionForm = async (req, res) => {
  try {
    const admissionData = new AdmissionForm(req.body);
    const savedAdmission = await admissionData.save();
    res.status(201).json(savedAdmission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all admission forms (GET)
export const getAdmissionForms = async (req, res) => {
  try {
    const admissions = await AdmissionForm.find();
    res.status(200).json(admissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an admission form by ID (DELETE)
export const deleteAdmissionForm = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAdmission = await AdmissionForm.findByIdAndDelete(id);

    if (!deletedAdmission) {
      return res.status(404).json({ message: "Admission form not found" });
    }

    res.status(200).json({ message: "Admission form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};