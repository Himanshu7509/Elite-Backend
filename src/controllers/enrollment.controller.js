import Enrollment from "../models/enrollment.model.js";

// Create a new enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { 
      studentName, studentEmail, studentPhone, courseName, message, productCompany, 
      age, gender, location, qualification,
      // Status fields
      status, callStatus, interviewRoundStatus, aptitudeRoundStatus, hrRoundStatus,
      admissionLetter, feesStatus, paymentMethod, feesInstallmentStructure,
      // Tracking fields
      assignedTo, assignedBy, assignedByName,
      createdBy, updatedBy, source,
      feedback, city, state, pincode,
      date
    } = req.body;

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
      // Basic fields
      studentName,
      studentEmail,
      studentPhone: studentPhone || null,
      courseName,
      message: message || null,
      productCompany,
      
      // Status fields
      status: status || 'pending',
      callStatus: callStatus || 'not_called',
      interviewRoundStatus: interviewRoundStatus || 'not_scheduled',
      aptitudeRoundStatus: aptitudeRoundStatus || 'not_scheduled',
      hrRoundStatus: hrRoundStatus || 'not_scheduled',
      admissionLetter: admissionLetter || 'not_issued',
      feesStatus: feesStatus || 'not_paid',
      paymentMethod: paymentMethod || 'other',
      feesInstallmentStructure: feesInstallmentStructure || 'one_time',
      
      // CRM fields
      assignedTo: assignedTo || null,
      assignedBy: assignedBy || null,
      assignedByName: assignedByName || null,
      
      // Tracking fields
      createdBy: createdBy || null,
      updatedBy: updatedBy || null,
      source: source || 'other',
      
      feedback: feedback || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      
      // Additional info
      age: age || null,
      gender: gender || null,
      location: location || null,
      qualification: qualification || null,
      
      // Date fields
      date: date || new Date()
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

// Update enrollment status and other status fields
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      callStatus, 
      interviewRoundStatus, 
      aptitudeRoundStatus, 
      hrRoundStatus, 
      admissionLetter, 
      feesStatus, 
      paymentMethod, 
      feesInstallmentStructure 
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    
    // Validate and update status fields
    if (status !== undefined) {
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status. Must be 'pending', 'confirmed', or 'cancelled'." 
        });
      }
      updateData.status = status;
    }
    
    if (callStatus !== undefined) {
      if (!["not_called", "called", "follow_up_required", "not_reachable"].includes(callStatus)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid call status." 
        });
      }
      updateData.callStatus = callStatus;
    }
    
    if (interviewRoundStatus !== undefined) {
      if (!["not_scheduled", "scheduled", "completed", "rescheduled", "cancelled"].includes(interviewRoundStatus)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid interview round status." 
        });
      }
      updateData.interviewRoundStatus = interviewRoundStatus;
    }
    
    if (aptitudeRoundStatus !== undefined) {
      if (!["not_scheduled", "scheduled", "completed", "rescheduled", "cancelled", "passed", "failed"].includes(aptitudeRoundStatus)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid aptitude round status." 
        });
      }
      updateData.aptitudeRoundStatus = aptitudeRoundStatus;
    }
    
    if (hrRoundStatus !== undefined) {
      if (!["not_scheduled", "scheduled", "completed", "rescheduled", "cancelled", "passed", "failed"].includes(hrRoundStatus)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid HR round status." 
        });
      }
      updateData.hrRoundStatus = hrRoundStatus;
    }
    
    if (admissionLetter !== undefined) {
      if (!["not_issued", "issued", "received"].includes(admissionLetter)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid admission letter status." 
        });
      }
      updateData.admissionLetter = admissionLetter;
    }
    
    if (feesStatus !== undefined) {
      if (!["not_paid", "partially_paid", "fully_paid"].includes(feesStatus)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid fees status." 
        });
      }
      updateData.feesStatus = feesStatus;
    }
    
    if (paymentMethod !== undefined) {
      if (!["UPI", "cash", "bank_transfer", "cheque", "other"].includes(paymentMethod)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid payment method." 
        });
      }
      updateData.paymentMethod = paymentMethod;
    }
    
    if (feesInstallmentStructure !== undefined) {
      if (!["one_time", "two_installments", "three_installments", "four_installments", "EMI", "Loan", "other"].includes(feesInstallmentStructure)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid fees installment structure." 
        });
      }
      updateData.feesInstallmentStructure = feesInstallmentStructure;
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one status field must be provided." 
      });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      id, 
      updateData,
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

// Update enrollment details
export const updateEnrollmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      // Basic fields
      studentName, studentEmail, studentPhone, courseName, message,
      age, gender, location, qualification,
      // Status fields
      status, callStatus, interviewRoundStatus, aptitudeRoundStatus, hrRoundStatus,
      admissionLetter, feesStatus, paymentMethod, feesInstallmentStructure,
      // CRM fields
      assignedTo, assignedBy, assignedByName,
      // Tracking fields
      createdBy, updatedBy, source,
      feedback, city, state, pincode,
      // Date fields
      date
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    
    // Basic fields
    if (studentName !== undefined) updateData.studentName = studentName;
    if (studentEmail !== undefined) updateData.studentEmail = studentEmail;
    if (studentPhone !== undefined) updateData.studentPhone = studentPhone;
    if (courseName !== undefined) updateData.courseName = courseName;
    if (message !== undefined) updateData.message = message;
    
    // Status fields
    if (status !== undefined) updateData.status = status;
    if (callStatus !== undefined) updateData.callStatus = callStatus;
    if (interviewRoundStatus !== undefined) updateData.interviewRoundStatus = interviewRoundStatus;
    if (aptitudeRoundStatus !== undefined) updateData.aptitudeRoundStatus = aptitudeRoundStatus;
    if (hrRoundStatus !== undefined) updateData.hrRoundStatus = hrRoundStatus;
    if (admissionLetter !== undefined) updateData.admissionLetter = admissionLetter;
    if (feesStatus !== undefined) updateData.feesStatus = feesStatus;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (feesInstallmentStructure !== undefined) updateData.feesInstallmentStructure = feesInstallmentStructure;
    
    // CRM fields
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (assignedBy !== undefined) updateData.assignedBy = assignedBy;
    if (assignedByName !== undefined) updateData.assignedByName = assignedByName;
    
    // Tracking fields
    if (createdBy !== undefined) updateData.createdBy = createdBy;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;
    if (source !== undefined) updateData.source = source;
    
    if (feedback !== undefined) updateData.feedback = feedback;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    
    // Additional info
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (location !== undefined) updateData.location = location;
    if (qualification !== undefined) updateData.qualification = qualification;
    
    // Date fields
    if (date !== undefined) updateData.date = date;

    const enrollment = await Enrollment.findByIdAndUpdate(
      id, 
      updateData,
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
      message: "Enrollment details updated successfully",
      data: enrollment 
    });
  } catch (error) {
    console.error("Error updating enrollment details:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update enrollment details",
      error: error.message 
    });
  }
};