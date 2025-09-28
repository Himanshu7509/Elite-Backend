import ComplainForm from "../models/complainform.model.js";

// Create a new complain entry (POST)
export const createComplain = async (req, res) => {
  try {
    const complainData = new ComplainForm(req.body);
    const savedComplain = await complainData.save();
    res.status(201).json(savedComplain);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all complain entries (GET)
export const getComplains = async (req, res) => {
  try {
    const complains = await ComplainForm.find();
    res.status(200).json(complains);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a complain entry by ID (DELETE)
export const deleteComplain = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedComplain = await ComplainForm.findByIdAndDelete(id);

    if (!deletedComplain) {
      return res.status(404).json({ message: "Complain not found" });
    }

    res.status(200).json({ message: "Complain deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};