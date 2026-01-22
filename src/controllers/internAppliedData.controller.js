import InternAppliedData from '../models/internAppliedData.model.js';
import { uploadFileToS3 } from '../utils/s3Upload.js';
import Team from '../models/team.model.js';

// Create new intern application
export const createInternApplication = async (req, res) => {
  try {
    const { fullName, email, phoneNo1, phoneNo2, postAppliedFor, productCompany } = req.body;

    // No required field validation - all fields are optional

    // Validate email format only if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }
    }

    // Validate phone numbers only if provided
    if (phoneNo1 && phoneNo1.trim() !== '') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phoneNo1)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number 1.'
        });
      }
    }

    if (phoneNo2 && phoneNo2.trim() !== '') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phoneNo2)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number 2.'
        });
      }
    }

    // Handle file uploads
    let resumeUrl = null;
    let photoUrl = null;

    if (req.files && typeof req.files === 'object') {
      // req.files is an object where keys are field names
      if (req.files.resume && Array.isArray(req.files.resume) && req.files.resume.length > 0) {
        const resumeFile = req.files.resume[0];
        try {
          const s3Result = await uploadFileToS3(resumeFile, 'intern-applications');
          resumeUrl = s3Result.Location;
        } catch (uploadError) {
          console.error('Error uploading resume to S3:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload resume',
            error: uploadError.message
          });
        }
      }
      
      if (req.files.photo && Array.isArray(req.files.photo) && req.files.photo.length > 0) {
        const photoFile = req.files.photo[0];
        try {
          const s3Result = await uploadFileToS3(photoFile, 'intern-applications');
          photoUrl = s3Result.Location;
        } catch (uploadError) {
          console.error('Error uploading photo to S3:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload photo',
            error: uploadError.message
          });
        }
      }
    }

    // Prepare created by information if user is authenticated
    let createdByInfo = null;
    let source = 'website'; // Default source
    
    // Handle automatic assignment for specific roles
    let assignedToValue = null;
    let assignedByValue = null;
    let assignedByNameValue = null;
    
    if (req.user) {
      createdByInfo = {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      };
      source = 'admin'; // Set source to admin if authenticated
      
      // If authenticated, check if user is from a role that should auto-assign
      if (req.user._id) {
        const foundTeamMember = await Team.findById(req.user._id);
        if (foundTeamMember) {
          // If a sales, marketing, counselor, telecaller, or HR person is creating an application, automatically assign it to them
          if (req.user.role === "sales" || req.user.role === "marketing" || req.user.role === "counsellor" || req.user.role === "telecaller" || req.user.role === "hr") {
            assignedToValue = foundTeamMember._id;
            assignedByValue = foundTeamMember._id;
            assignedByNameValue = foundTeamMember.name;
          }
        }
      }
    }

    const newApplication = new InternAppliedData({
      fullName,
      email,
      phoneNo1,
      phoneNo2,
      postAppliedFor,
      productCompany,
      resumeUrl,
      photoUrl,
      // Set default values for tracking fields
      status: 'unread',
      callStatus: 'not_called',
      interviewRoundStatus: 'not_scheduled',
      aptitudeRoundStatus: 'not_scheduled',
      hrRoundStatus: 'not_scheduled',
      admissionLetter: 'not_issued',
      feesStatus: 'not_paid',
      date: new Date(),
      source: source, // Set source based on authentication
      createdBy: createdByInfo,
      // Add assignment fields
      assignedTo: assignedToValue,
      assignedBy: assignedByValue,
      assignedByName: assignedByNameValue
    });

    const savedApplication = await newApplication.save();
    
    // If this is a sales, marketing, counselor, telecaller, or HR person's application, update their assigned applications
    if (req.user && (req.user.role === 'sales' || req.user.role === 'marketing' || req.user.role === 'counsellor' || req.user.role === 'telecaller' || req.user.role === 'hr') && req.user._id) {
      const teamMember = await Team.findById(req.user._id);
      if (teamMember) {
        await Team.findByIdAndUpdate(teamMember._id, {
          $addToSet: { assignedApplications: savedApplication._id },
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Intern application created successfully',
      data: savedApplication
    });
  } catch (error) {
    console.error('Error creating intern application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create intern application',
      error: error.message
    });
  }
};

// Get all intern applications
export const getAllInternApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Add search filters if provided
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phoneNo1: searchRegex },
        { postAppliedFor: searchRegex }
      ];
    }

    // Add specific field filters if provided
    if (req.query.fullName) {
      filter.fullName = { $regex: req.query.fullName, $options: 'i' };
    }
    if (req.query.email) {
      filter.email = { $regex: req.query.email, $options: 'i' };
    }
    if (req.query.phoneNo1) {
      filter.phoneNo1 = { $regex: req.query.phoneNo1, $options: 'i' };
    }
    if (req.query.postAppliedFor) {
      filter.postAppliedFor = { $regex: req.query.postAppliedFor, $options: 'i' };
    }

    const totalCount = await InternAppliedData.countDocuments(filter);
    const applications = await InternAppliedData.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: applications,
      count: applications.length,
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching intern applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch intern applications',
      error: error.message
    });
  }
};

// Get intern application by ID
export const getInternApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await InternAppliedData.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Intern application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching intern application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch intern application',
      error: error.message
    });
  }
};

// Update intern application
export const updateInternApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Debug logging to see what's in the request
    console.log('Update request received for ID:', id);
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Request body values:', req.body);
    console.log('Request files present:', !!req.files);
    if (req.files) {
      console.log('Request files keys:', Object.keys(req.files));
    }
    console.log('Request user (if authenticated):', req.user ? { _id: req.user._id, email: req.user.email, role: req.user.role } : 'Not present');
    
    const { fullName, email, phoneNo1, phoneNo2, postAppliedFor, productCompany, status, callStatus, interviewRoundStatus, aptitudeRoundStatus, hrRoundStatus, admissionLetter, feesStatus, paymentMethod, feesInstallmentStructure, feedback, city, state, pincode, assignedTo, assignedBy, assignedByName, // Personal Information
    fatherName, fathersContactNo, address, gender, dateOfBirth, age, maritalStatus, category, nationality, religion, // Education Information
    highestDegree, specialization, collegeOrInstituteName, schoolName, experience, skills, previousCompany, previousSalary, // Application Information
    modeOfTraining, expectedJoiningDate, expectedSalary, currentSalary, noticePeriod, source: sourceField, sourceName } = req.body;

    console.log('Extracted fields from body:', {
      fullName: fullName,
      email: email,
      hasFullName: fullName !== undefined,
      hasEmail: email !== undefined,
      // ... other fields as needed
    });

    const application = await InternAppliedData.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Intern application not found'
      });
    }

    // Validate fields only if they are provided and not empty
    if (fullName !== undefined && fullName !== null && fullName !== '' && fullName !== 'null' && fullName !== 'undefined') {
      if (typeof fullName === 'string' && !fullName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required.'
        });
      }
    }

    if (email !== undefined && email !== null && email !== '' && email !== 'null' && email !== 'undefined') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof email === 'string' && !emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }
    }

    if (phoneNo1 !== undefined && phoneNo1 !== null && phoneNo1 !== '' && phoneNo1 !== 'null' && phoneNo1 !== 'undefined') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (typeof phoneNo1 === 'string' && !phoneRegex.test(phoneNo1)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number 1.'
        });
      }
    }

    if (phoneNo2 !== undefined && phoneNo2 !== null && phoneNo2 !== '' && phoneNo2 !== 'null' && phoneNo2 !== 'undefined') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (typeof phoneNo2 === 'string' && !phoneRegex.test(phoneNo2)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number 2.'
        });
      }
    }

    // No required field validation for productCompany - removing the validation

    // Handle file uploads
    let resumeUrl = application.resumeUrl;
    let photoUrl = application.photoUrl;

    if (req.files) {
      // req.files is an object where keys are field names and values are arrays of files
      if (req.files.resume && Array.isArray(req.files.resume) && req.files.resume.length > 0) {
        try {
          const resumeFile = req.files.resume[0];
          const s3Result = await uploadFileToS3(resumeFile, 'intern-applications');
          resumeUrl = s3Result.Location;
        } catch (uploadError) {
          console.error('Error uploading resume to S3:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload resume',
            error: uploadError.message
          });
        }
      }
      
      if (req.files.photo && Array.isArray(req.files.photo) && req.files.photo.length > 0) {
        try {
          const photoFile = req.files.photo[0];
          const s3Result = await uploadFileToS3(photoFile, 'intern-applications');
          photoUrl = s3Result.Location;
        } catch (uploadError) {
          console.error('Error uploading photo to S3:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload photo',
            error: uploadError.message
          });
        }
      }
    }

    // Prepare update object by filtering out fields that shouldn't be updated
    const updateObject = {};
    
    // Only add fields to update object if they are explicitly provided and not empty strings
    if (fullName !== undefined && fullName !== null && fullName !== '' && fullName !== 'null' && fullName !== 'undefined') {
      updateObject.fullName = fullName;
    }
    if (email !== undefined && email !== null && email !== '' && email !== 'null' && email !== 'undefined') {
      updateObject.email = email;
    }
    if (phoneNo1 !== undefined && phoneNo1 !== null && phoneNo1 !== '' && phoneNo1 !== 'null' && phoneNo1 !== 'undefined') {
      updateObject.phoneNo1 = phoneNo1;
    }
    if (phoneNo2 !== undefined && phoneNo2 !== null && phoneNo2 !== '' && phoneNo2 !== 'null' && phoneNo2 !== 'undefined') {
      updateObject.phoneNo2 = phoneNo2;
    }
    if (postAppliedFor !== undefined && postAppliedFor !== null && postAppliedFor !== '' && postAppliedFor !== 'null' && postAppliedFor !== 'undefined') {
      updateObject.postAppliedFor = postAppliedFor;
    }
    if (productCompany !== undefined && productCompany !== null && productCompany !== '' && productCompany !== 'null' && productCompany !== 'undefined') {
      updateObject.productCompany = productCompany;
    }
    
    // Always update URLs if files were uploaded
    updateObject.resumeUrl = resumeUrl;
    updateObject.photoUrl = photoUrl;
    
    // Update tracking fields if provided
    if (status !== undefined && status !== null && status !== '' && status !== 'null' && status !== 'undefined') {
      updateObject.status = status;
    }
    if (callStatus !== undefined && callStatus !== null && callStatus !== '' && callStatus !== 'null' && callStatus !== 'undefined') {
      updateObject.callStatus = callStatus;
    }
    if (interviewRoundStatus !== undefined && interviewRoundStatus !== null && interviewRoundStatus !== '' && interviewRoundStatus !== 'null' && interviewRoundStatus !== 'undefined') {
      updateObject.interviewRoundStatus = interviewRoundStatus;
    }
    if (aptitudeRoundStatus !== undefined && aptitudeRoundStatus !== null && aptitudeRoundStatus !== '' && aptitudeRoundStatus !== 'null' && aptitudeRoundStatus !== 'undefined') {
      updateObject.aptitudeRoundStatus = aptitudeRoundStatus;
    }
    if (hrRoundStatus !== undefined && hrRoundStatus !== null && hrRoundStatus !== '' && hrRoundStatus !== 'null' && hrRoundStatus !== 'undefined') {
      updateObject.hrRoundStatus = hrRoundStatus;
    }
    if (admissionLetter !== undefined && admissionLetter !== null && admissionLetter !== '' && admissionLetter !== 'null' && admissionLetter !== 'undefined') {
      updateObject.admissionLetter = admissionLetter;
    }
    if (feesStatus !== undefined && feesStatus !== null && feesStatus !== '' && feesStatus !== 'null' && feesStatus !== 'undefined') {
      updateObject.feesStatus = feesStatus;
    }
    if (paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== '' && paymentMethod !== 'null' && paymentMethod !== 'undefined') {
      updateObject.paymentMethod = paymentMethod;
    }
    if (feesInstallmentStructure !== undefined && feesInstallmentStructure !== null && feesInstallmentStructure !== '' && feesInstallmentStructure !== 'null' && feesInstallmentStructure !== 'undefined') {
      updateObject.feesInstallmentStructure = feesInstallmentStructure;
    }
    if (feedback !== undefined && feedback !== null && feedback !== '' && feedback !== 'null' && feedback !== 'undefined') {
      updateObject.feedback = feedback;
    }
    if (city !== undefined && city !== null && city !== '' && city !== 'null' && city !== 'undefined') {
      updateObject.city = city;
    }
    if (state !== undefined && state !== null && state !== '' && state !== 'null' && state !== 'undefined') {
      updateObject.state = state;
    }
    if (pincode !== undefined && pincode !== null && pincode !== '' && pincode !== 'null' && pincode !== 'undefined') {
      updateObject.pincode = pincode;
    }
    if (assignedTo !== undefined && assignedTo !== null && assignedTo !== 'null' && assignedTo !== 'undefined') {
      updateObject.assignedTo = assignedTo;
    }
    if (assignedBy !== undefined && assignedBy !== null && assignedBy !== 'null' && assignedBy !== 'undefined') {
      updateObject.assignedBy = assignedBy;
    }
    if (assignedByName !== undefined && assignedByName !== null && assignedByName !== '' && assignedByName !== 'null' && assignedByName !== 'undefined') {
      updateObject.assignedByName = assignedByName;
    }
    // Personal Information
    if (fatherName !== undefined && fatherName !== null && fatherName !== '' && fatherName !== 'null' && fatherName !== 'undefined') {
      updateObject.fatherName = fatherName;
    }
    if (fathersContactNo !== undefined && fathersContactNo !== null && fathersContactNo !== '' && fathersContactNo !== 'null' && fathersContactNo !== 'undefined') {
      updateObject.fathersContactNo = fathersContactNo;
    }
    if (address !== undefined && address !== null && address !== '' && address !== 'null' && address !== 'undefined') {
      updateObject.address = address;
    }
    if (gender !== undefined && gender !== null && gender !== '' && gender !== 'null' && gender !== 'undefined') {
      updateObject.gender = gender;
    }
    if (dateOfBirth !== undefined && dateOfBirth !== null && dateOfBirth !== '' && dateOfBirth !== 'null' && dateOfBirth !== 'undefined') {
      updateObject.dateOfBirth = dateOfBirth;
    }
    if (age !== undefined && age !== null && age !== '' && age !== 'null' && age !== 'undefined') {
      updateObject.age = age;
    }
    if (maritalStatus !== undefined && maritalStatus !== null && maritalStatus !== '' && maritalStatus !== 'null' && maritalStatus !== 'undefined') {
      updateObject.maritalStatus = maritalStatus;
    }
    if (category !== undefined && category !== null && category !== '' && category !== 'null' && category !== 'undefined') {
      updateObject.category = category;
    }
    if (nationality !== undefined && nationality !== null && nationality !== '' && nationality !== 'null' && nationality !== 'undefined') {
      updateObject.nationality = nationality;
    }
    if (religion !== undefined && religion !== null && religion !== '' && religion !== 'null' && religion !== 'undefined') {
      updateObject.religion = religion;
    }
    // Education Information
    if (highestDegree !== undefined && highestDegree !== null && highestDegree !== '' && highestDegree !== 'null' && highestDegree !== 'undefined') {
      updateObject.highestDegree = highestDegree;
    }
    if (specialization !== undefined && specialization !== null && specialization !== '' && specialization !== 'null' && specialization !== 'undefined') {
      updateObject.specialization = specialization;
    }
    if (collegeOrInstituteName !== undefined && collegeOrInstituteName !== null && collegeOrInstituteName !== '' && collegeOrInstituteName !== 'null' && collegeOrInstituteName !== 'undefined') {
      updateObject.collegeOrInstituteName = collegeOrInstituteName;
    }
    if (schoolName !== undefined && schoolName !== null && schoolName !== '' && schoolName !== 'null' && schoolName !== 'undefined') {
      updateObject.schoolName = schoolName;
    }
    if (experience !== undefined && experience !== null && experience !== '' && experience !== 'null' && experience !== 'undefined') {
      updateObject.experience = experience;
    }
    if (skills !== undefined && skills !== null && skills !== '' && skills !== 'null' && skills !== 'undefined') {
      updateObject.skills = skills;
    }
    if (previousCompany !== undefined && previousCompany !== null && previousCompany !== '' && previousCompany !== 'null' && previousCompany !== 'undefined') {
      updateObject.previousCompany = previousCompany;
    }
    if (previousSalary !== undefined && previousSalary !== null && previousSalary !== '' && previousSalary !== 'null' && previousSalary !== 'undefined') {
      updateObject.previousSalary = previousSalary;
    }
    // Application Information
    if (modeOfTraining !== undefined && modeOfTraining !== null && modeOfTraining !== '' && modeOfTraining !== 'null' && modeOfTraining !== 'undefined') {
      updateObject.modeOfTraining = modeOfTraining;
    }
    if (expectedJoiningDate !== undefined && expectedJoiningDate !== null && expectedJoiningDate !== '' && expectedJoiningDate !== 'null' && expectedJoiningDate !== 'undefined') {
      updateObject.expectedJoiningDate = expectedJoiningDate;
    }
    if (expectedSalary !== undefined && expectedSalary !== null && expectedSalary !== '' && expectedSalary !== 'null' && expectedSalary !== 'undefined') {
      updateObject.expectedSalary = expectedSalary;
    }
    if (currentSalary !== undefined && currentSalary !== null && currentSalary !== '' && currentSalary !== 'null' && currentSalary !== 'undefined') {
      updateObject.currentSalary = currentSalary;
    }
    if (noticePeriod !== undefined && noticePeriod !== null && noticePeriod !== '' && noticePeriod !== 'null' && noticePeriod !== 'undefined') {
      updateObject.noticePeriod = noticePeriod;
    }
    if (sourceField !== undefined && sourceField !== null && sourceField !== '' && sourceField !== 'null' && sourceField !== 'undefined') {
      updateObject.source = sourceField;  // Map sourceField back to source for DB
    }
    if (sourceName !== undefined && sourceName !== null && sourceName !== '' && sourceName !== 'null' && sourceName !== 'undefined') {
      updateObject.sourceName = sourceName;
    }

    // Add updatedBy information if user is authenticated
    if (req.user) {
      updateObject.updatedBy = {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      };
    }
    
    console.log('Final update object:', updateObject);
    
    const updatedApplication = await InternAppliedData.findByIdAndUpdate(
      id,
      updateObject,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Intern application updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating intern application:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update intern application',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete intern application
export const deleteInternApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await InternAppliedData.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Intern application not found'
      });
    }

    await InternAppliedData.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Intern application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting intern application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete intern application',
      error: error.message
    });
  }
};