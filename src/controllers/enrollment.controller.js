import Enrollment from "../models/enrollment.model.js";

// Create a new enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { studentName, studentEmail, studentPhone, courseName, message, productCompany } = req.body;

    // Validate required fields
    if (!studentName || !studentEmail || !courseName || !productCompany) {
      return res.status(400).json({ 
        success: false, 
        message: "Student name, email, course name, and product company are required." 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a valid email address." 
      });
    }

    const newEnrollment = new Enrollment({
      studentName,
      studentEmail,
      studentPhone: studentPhone || null,
      courseName,
      message: message || null,
      productCompany
    });

    await newEnrollment.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Enrollment created successfully",
      data: newEnrollment 
    });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create enrollment",
      error: error.message 
    });
  }
};

// Get all enrollments
export const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: enrollments,
      count: enrollments.length
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch enrollments",
      error: error.message 
    });
  }
};

// Get enrollment by ID
export const getEnrollmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: "Enrollment not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: enrollment 
    });
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch enrollment",
      error: error.message 
    });
  }
};

// Update enrollment status
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Must be 'pending', 'confirmed', or 'cancelled'." 
      });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      id, 
      { status },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: "Enrollment not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Enrollment status updated successfully",
      data: enrollment 
    });
  } catch (error) {
    console.error("Error updating enrollment status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update enrollment status",
      error: error.message 
    });
  }
};

// Delete enrollment
export const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findByIdAndDelete(id);

    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: "Enrollment not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Enrollment deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete enrollment",
      error: error.message 
    });
  }
};