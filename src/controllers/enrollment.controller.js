import Enrollment from "../models/enrollment.model.js";
import Team from "../models/team.model.js";

// Create a new enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { 
      studentName, studentEmail, studentPhone, courseName, message, productCompany, 
      age, gender, location, qualification,
      experience, specialisation, highestDegree, collegeOrInstituteName, schoolName,
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
    
    // Validate productCompany
    const validProductCompanies = ['JIFSA', 'Elite-BIM', 'Elite-BIFS', 'EEE-Technologies', 'Elite-Jobs', 'Elite-Cards'];
    if (!validProductCompanies.includes(productCompany)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product company. Must be one of: " + validProductCompanies.join(', ') 
      });
    }
    
    // Prepare created by information if user is authenticated
    let createdByInfo = null;
    let sourceType = source || 'other';
    
    if (req.user) {
      createdByInfo = {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name || req.user.email
      };
      sourceType = 'admin'; // Set source to admin if authenticated
    }

    // Handle automatic assignment for specific roles
    let assignedToValue = assignedTo || null;
    let assignedByValue = assignedBy || null;
    let assignedByNameValue = assignedByName || null;
    
    if (req.user && req.user._id) {
      const teamMember = await Team.findById(req.user._id);
      if (teamMember) {
        // If a sales, marketing, counselor, telecaller, or HR person is creating an enrollment, automatically assign it to them
        if (req.user.role === "sales" || req.user.role === "marketing" || req.user.role === "counsellor" || req.user.role === "telecaller" || req.user.role === "hr") {
          assignedToValue = teamMember._id;
          assignedByValue = teamMember._id;
          assignedByNameValue = teamMember.name;
        }
      }
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
      assignedTo: assignedToValue,
      assignedBy: assignedByValue,
      assignedByName: assignedByNameValue,
      
      // Tracking fields
      createdBy: createdBy || createdByInfo,
      updatedBy: updatedBy || null,
      source: sourceType,
      
      feedback: feedback || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      
      // Additional info
      age: age || null,
      gender: gender || null,
      location: location || null,
      qualification: qualification || null,
      
      // Education & Experience
      experience: experience || null,
      specialisation: specialisation || null,
      highestDegree: highestDegree || null,
      collegeOrInstituteName: collegeOrInstituteName || null,
      schoolName: schoolName || null,
      
      // Date fields
      date: date || new Date()
    });

    const savedEnrollment = await newEnrollment.save();
    
    // If this is a sales, marketing, counselor, telecaller, or HR person's enrollment, update their assigned enrollments
    if (req.user && (req.user.role === "sales" || req.user.role === "marketing" || req.user.role === "counsellor" || req.user.role === "telecaller" || req.user.role === "hr") && req.user._id) {
      const teamMember = await Team.findById(req.user._id);
      if (teamMember) {
        await Team.findByIdAndUpdate(teamMember._id, {
          $addToSet: { assignedEnrollments: savedEnrollment._id },
        });
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: "Enrollment created successfully",
      data: savedEnrollment 
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
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('createdBy.userId', 'name email role')
      .populate('updatedBy.userId', 'name email role')
      .populate('remarks.createdBy', 'name email')
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
    const enrollment = await Enrollment.findById(id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('createdBy.userId', 'name email role')
      .populate('updatedBy.userId', 'name email role')
      .populate('remarks.createdBy', 'name email');

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
      experience, specialisation, highestDegree, collegeOrInstituteName, schoolName,
      productCompany,
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

    // Validate productCompany if provided
    if (productCompany !== undefined) {
      const validProductCompanies = ['JIFSA', 'Elite-BIM', 'Elite-BIFS', 'EEE-Technologies', 'Elite-Jobs', 'Elite-Cards'];
      if (!validProductCompanies.includes(productCompany)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product company. Must be one of: " + validProductCompanies.join(', ') 
        });
      }
    }
    
    // Build update object with only provided fields
    const updateData = {};
    
    // Basic fields
    if (studentName !== undefined) updateData.studentName = studentName;
    if (studentEmail !== undefined) updateData.studentEmail = studentEmail;
    if (studentPhone !== undefined) updateData.studentPhone = studentPhone;
    if (courseName !== undefined) updateData.courseName = courseName;
    if (message !== undefined) updateData.message = message;
    if (productCompany !== undefined) updateData.productCompany = productCompany;
    
    // Additional info
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (location !== undefined) updateData.location = location;
    if (qualification !== undefined) updateData.qualification = qualification;
    
    // Education & Experience
    if (experience !== undefined) updateData.experience = experience;
    if (specialisation !== undefined) updateData.specialisation = specialisation;
    if (highestDegree !== undefined) updateData.highestDegree = highestDegree;
    if (collegeOrInstituteName !== undefined) updateData.collegeOrInstituteName = collegeOrInstituteName;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    
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
    if (assignedTo !== undefined) {
      // Find the team member who is receiving the enrollment
      const assignedUser = await Team.findOne({ email: assignedTo });
      if (assignedUser) {
        updateData.assignedTo = assignedUser._id;
      } else {
        updateData.assignedTo = null;
      }
    }
    
    if (assignedBy !== undefined) {
      // Find the team member who is doing the assignment
      const assignedByUser = await Team.findOne({ email: assignedBy });
      if (assignedByUser) {
        updateData.assignedBy = assignedByUser._id;
        updateData.assignedByName = assignedByUser.name;
      } else {
        // If not a team member, store the email as name
        updateData.assignedByName = assignedBy;
      }
    } else if (assignedByName !== undefined) {
      updateData.assignedByName = assignedByName;
    }
    
    // Tracking fields
    if (createdBy !== undefined) updateData.createdBy = createdBy;
    if (updatedBy !== undefined) updateData.updatedBy = updatedBy;
    if (source !== undefined) updateData.source = source;
    
    if (feedback !== undefined) updateData.feedback = feedback;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    
    if (date !== undefined) updateData.date = date;
    
    // If user is authenticated, update the updatedBy field
    if (req.user) {
      updateData.updatedBy = {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name || req.user.email
      };
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
    .populate('createdBy.userId', 'name email role')
    .populate('updatedBy.userId', 'name email role')
    .populate('remarks.createdBy', 'name email');

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

// Update education status
export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { educationField } = req.body;
    
    // Validate education field
    const validFields = ['tenth', 'twelfth', 'undergraduate', 'postgraduate', 'phd'];
    if (!validFields.includes(educationField)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid education field" 
      });
    }
    
    // Check if user has permission to update this enrollment
    let enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: "Enrollment not found" 
      });
    }
    
    // Toggle the education field
    const currentValue = enrollment.education && enrollment.education[educationField] ? enrollment.education[educationField] : false;
    
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      id,
      {
        $set: {
          [`education.${educationField}`]: !currentValue
        }
      },
      { new: true }
    ).populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('createdBy.userId', 'name email role')
      .populate('updatedBy.userId', 'name email role')
      .populate('remarks.createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: "Education updated successfully",
      data: updatedEnrollment
    });
  } catch (error) {
    console.error("Error updating education:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update education",
      error: error.message 
    });
  }
};

// Add remark to an enrollment
export const addRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, reminderDate, status } = req.body;
    
    // Validate required fields
    if (!message || !status) {
      return res.status(400).json({ 
        success: false,
        message: "Message and status are required" 
      });
    }
    
    // Check if user has permission to update this enrollment
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ 
        success: false,
        message: "Enrollment not found" 
      });
    }
    
    // Calculate the sequence number for the new remark
    const sequenceNumber = enrollment.remarks ? enrollment.remarks.length + 1 : 1;
    
    // Create the new remark
    const newRemark = {
      sequenceNumber,
      message,
      reminderDate: reminderDate ? new Date(reminderDate) : undefined,
      status,
      createdBy: req.user._id, // This should now be available due to verifyToken middleware
      createdAt: new Date()
    };
    
    // Update the enrollment with the new remark
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      id,
      { $push: { remarks: newRemark } },
      { new: true }
    )
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
    .populate('createdBy.userId', 'name email role')
    .populate('updatedBy.userId', 'name email role')
    .populate('remarks.createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: "Remark added successfully",
      data: updatedEnrollment
    });
  } catch (error) {
    console.error("Error adding remark:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add remark",
      error: error.message 
    });
  }
};