import BimEnquiryForm from "../models/bim-enquiryform.model.js";

// Create a new BIM Enquiry entry (POST)
export const createBimEnquiry = async (req, res) => {
  try {
    const enquiryData = new BimEnquiryForm(req.body);
    const savedEnquiry = await enquiryData.save();
    res.status(201).json(savedEnquiry);
  } catch (error) {
    console.error("Error creating enquiry:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Get all BIM Enquiry entries (GET)
export const getBimEnquiries = async (req, res) => {
  try {
    const enquiries = await BimEnquiryForm.find();
    res.status(200).json(enquiries);
  } catch (error) {
    console.error("Error fetching enquiries:", error.message);
    res.status(500).json({ 
      message: "Failed to fetch enquiries",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Delete a BIM Enquiry entry by ID (DELETE)
export const deleteBimEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEnquiry = await BimEnquiryForm.findByIdAndDelete(id);

    if (!deletedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json({ message: "Enquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting enquiry:", error.message);
    res.status(500).json({ message: error.message });
  }
};
