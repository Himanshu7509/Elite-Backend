import InternAppliedData from '../models/internAppliedData.model.js';
import { uploadFileToS3 } from '../utils/s3Upload.js';

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
    
    if (req.user) {
      createdByInfo = {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      };
      source = 'admin'; // Set source to admin if authenticated
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
      createdBy: createdByInfo
    });

    await newApplication.save();

    res.status(201).json({
      success: true,
      message: 'Intern application created successfully',
      data: newApplication
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
    const { fullName, email, phoneNo1, phoneNo2, postAppliedFor, productCompany, status, callStatus, interviewRoundStatus, aptitudeRoundStatus, hrRoundStatus, admissionLetter, feesStatus, paymentMethod, feesInstallmentStructure, feedback, city, state, pincode, assignedTo, assignedBy, assignedByName } = req.body;

    const application = await InternAppliedData.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Intern application not found'
      });
    }

    // Validate required fields if they are provided
    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Full name is required.'
        });
      }
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }
    }

    if (phoneNo1 !== undefined) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phoneNo1)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number 1.'
        });
      }
    }

    if (phoneNo2 !== undefined && phoneNo2 !== '') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phoneNo2)) {
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
      for (const file of req.files) {
        if (file.fieldname === 'resume') {
          try {
            const s3Result = await uploadFileToS3(file, 'intern-applications');
            resumeUrl = s3Result.Location;
          } catch (uploadError) {
            console.error('Error uploading resume to S3:', uploadError);
            return res.status(500).json({
              success: false,
              message: 'Failed to upload resume',
              error: uploadError.message
            });
          }
        } else if (file.fieldname === 'photo') {
          try {
            const s3Result = await uploadFileToS3(file, 'intern-applications');
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
    }

    const updatedApplication = await InternAppliedData.findByIdAndUpdate(
      id,
      {
        fullName: fullName !== undefined ? fullName : application.fullName,
        email: email !== undefined ? email : application.email,
        phoneNo1: phoneNo1 !== undefined ? phoneNo1 : application.phoneNo1,
        phoneNo2: phoneNo2 !== undefined ? phoneNo2 : application.phoneNo2,
        postAppliedFor: postAppliedFor !== undefined ? postAppliedFor : application.postAppliedFor,
        productCompany: productCompany !== undefined ? productCompany : application.productCompany,
        resumeUrl,
        photoUrl,
        // Update tracking fields if provided
        status: status !== undefined ? status : application.status,
        callStatus: callStatus !== undefined ? callStatus : application.callStatus,
        interviewRoundStatus: interviewRoundStatus !== undefined ? interviewRoundStatus : application.interviewRoundStatus,
        aptitudeRoundStatus: aptitudeRoundStatus !== undefined ? aptitudeRoundStatus : application.aptitudeRoundStatus,
        hrRoundStatus: hrRoundStatus !== undefined ? hrRoundStatus : application.hrRoundStatus,
        admissionLetter: admissionLetter !== undefined ? admissionLetter : application.admissionLetter,
        feesStatus: feesStatus !== undefined ? feesStatus : application.feesStatus,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : application.paymentMethod,
        feesInstallmentStructure: feesInstallmentStructure !== undefined ? feesInstallmentStructure : application.feesInstallmentStructure,
        feedback: feedback !== undefined ? feedback : application.feedback,
        city: city !== undefined ? city : application.city,
        state: state !== undefined ? state : application.state,
        pincode: pincode !== undefined ? pincode : application.pincode,
        assignedTo: assignedTo !== undefined ? assignedTo : application.assignedTo,
        assignedBy: assignedBy !== undefined ? assignedBy : application.assignedBy,
        assignedByName: assignedByName !== undefined ? assignedByName : application.assignedByName
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Intern application updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating intern application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update intern application',
      error: error.message
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