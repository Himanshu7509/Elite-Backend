import Report from "../models/report.model.js";
import Team from "../models/team.model.js";
import { uploadFileToS3, deleteFileFromS3 } from "../utils/s3.utils.js";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF and image files
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed!'), false);
    }
  }
});

// Create a new report
export const createReport = async (req, res) => {
  try {
    const { reportField, linkField, attendance } = req.body;
    
    // Allow all authenticated users to create reports
    // const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller', 'hr'];
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, telecaller, and HR roles can create reports."
    //   });
    // }



    // Validate required fields
    if (!reportField) {
      return res.status(400).json({ 
        success: false, 
        message: "Report field is required." 
      });
    }



    // Handle file uploads
    let uploadFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadFileToS3(file, 'reports');
          uploadFiles.push({
            fileName: file.originalname,
            fileUrl: result.Location,
            fileType: file.mimetype
          });
        } catch (uploadError) {
          console.error("Error uploading file to S3:", uploadError);
          return res.status(500).json({ 
            success: false, 
            message: "Failed to upload file to S3",
            error: uploadError.message 
          });
        }
      }
    }

    // Create new report
    const newReport = new Report({
      userId: req.user._id,
      userName: req.user.name || req.user.email,
      userEmail: req.user.email,
      userRole: req.user.role,
      reportField,
      linkField: linkField || null,
      uploadFiles,
      attendance: {
        date: attendance && attendance.date ? new Date(attendance.date) : null,
        morningTime: attendance && attendance.morningTime ? attendance.morningTime : null,
        eveningTime: attendance && attendance.eveningTime ? attendance.eveningTime : null
      }
    });

    await newReport.save();

    res.status(201).json({ 
      success: true, 
      message: "Report created successfully",
      data: newReport 
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create report",
      error: error.message 
    });
  }
};

// Get all reports for a user
export const getUserReports = async (req, res) => {
  try {
    // Allow all authenticated users to view reports
    // const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller', 'hr'];
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, telecaller, and HR roles can view reports." 
    //   });
    // }

    // Log incoming query parameters for debugging
    console.log('Incoming query parameters:', req.query);
    console.log('User role:', req.user.role);
    console.log('Decoded userName parameter:', decodeURIComponent(req.query.userName || ''));

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    // Add filters if provided
    if (req.query.userId) {
      query.userId = req.query.userId;
    }
    
    if (req.query.userName) {
      // Decode URL-encoded parameter and trim whitespace
      const searchName = decodeURIComponent(req.query.userName).trim();
      console.log('Original search parameter:', req.query.userName);
      console.log('Decoded search name:', searchName);
      
      // Split the search name by spaces to handle multi-word searches (e.g., "Nandini Bhawre")
      const nameParts = searchName.split(/\s+/).filter(part => part.length > 0);
      
      if (nameParts.length === 1) {
        // Single word search - match any of the fields
        query.$or = [
          { 'userId.name': { $regex: searchName, $options: 'i' } },
          { 'userName': { $regex: searchName, $options: 'i' } },
          { 'userEmail': { $regex: searchName, $options: 'i' } }
        ];
      } else {
        // Multi-word search - create OR conditions for each name part across all fields
        // This allows matching "Nandini" OR "Bhawre" in any of the name/email fields
        const orConditions = [];
        nameParts.forEach(part => {
          orConditions.push(
            { 'userId.name': { $regex: part, $options: 'i' } },
            { 'userName': { $regex: part, $options: 'i' } },
            { 'userEmail': { $regex: part, $options: 'i' } }
          );
        });
        
        query.$or = orConditions;
      }
      
      console.log('Name filter query:', query.$or);
    }
    
    // Add role filter if provided
    if (req.query.userRole) {
      query.userRole = req.query.userRole;
    }
    
    // Handle date filtering (both attendance date and created date)
    if (req.query.date) {
      // Filter by specific date - convert to start and end of that day
      console.log('Processing date filter:', req.query.date);
      const specificDate = new Date(req.query.date);
      console.log('Specific date object:', specificDate);
      
      // Create start and end of the day in UTC to avoid timezone issues
      const startOfDay = new Date(specificDate.getFullYear(), specificDate.getMonth(), specificDate.getDate());
      const endOfDay = new Date(specificDate.getFullYear(), specificDate.getMonth(), specificDate.getDate() + 1);
      endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1); // Subtract 1 ms to get 23:59:59.999
      
      console.log('Start of day:', startOfDay, 'End of day:', endOfDay);
      
      // Query should match either attendance date OR created date
      query.$or = [
        { 'attendance.date': { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } }
      ];
      
      console.log('Date query added with $or:', query.$or);
    } else if (req.query.startDate || req.query.endDate) {
      // Handle date range filtering for both attendance date and created date
      const dateRangeCondition = {};
      
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        startDate.setHours(0, 0, 0, 0);
        dateRangeCondition.$gte = startDate;
      }
      
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateRangeCondition.$lte = endDate;
      }
      
      query.$or = [
        { 'attendance.date': dateRangeCondition },
        { createdAt: dateRangeCondition }
      ];
    }
    
    // Handle day filter (for both attendance date and created date) - this should work when some date constraint exists
    if (req.query.day) {
      // Map day names to MongoDB $dayOfWeek values (Sunday = 1, Monday = 2, etc.)
      const dayMap = {
        'sunday': 1,
        'monday': 2,
        'tuesday': 3,
        'wednesday': 4,
        'thursday': 5,
        'friday': 6,
        'saturday': 7
      };
      
      const dayValue = dayMap[req.query.day.toLowerCase()];
      if (dayValue) {
        // Add condition to match day of week for both attendance date and created date
        const dayCondition = {
          $or: [
            { $expr: { $eq: [{ $dayOfWeek: "$attendance.date" }, dayValue] } },
            { $expr: { $eq: [{ $dayOfWeek: "$createdAt" }, dayValue] } }
          ]
        };
        
        // If there's already a $or condition (from date filter), we need to use $and to combine
        if (query.$or) {
          // Wrap existing $or condition and day condition in an $and
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [
            { $or: existingOr },
            dayCondition
          ];
        } else {
          if (!query.$and) query.$and = [];
          query.$and.push(dayCondition);
        }
      }
    }

    // Log the final query for debugging
    console.log('Final query:', JSON.stringify(query, null, 2));

    // Get total count
    const totalCount = await Report.countDocuments(query);
    console.log('Total matching documents:', totalCount);
    
    // Get paginated results
    let reports;
    if (req.user.role === 'admin') {
      reports = await Report.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } else {
      reports = await Report.find({ ...query, userId: req.user._id })
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    // Log results for debugging
    console.log('Number of reports returned:', reports.length);
    if (reports.length > 0) {
      console.log('Sample report userName:', reports[0].userName);
      console.log('Sample report userId.name:', reports[0].userId?.name);
    }

    res.status(200).json({ 
      success: true, 
      data: reports,
      count: reports.length,
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch reports",
      error: error.message 
    });
  }
};

// Get a specific report by ID
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    // Allow all authenticated users to view reports
    // const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller', 'hr'];
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, telecaller, and HR roles can view reports." 
    //   });
    // }

    const report = await Report.findById(id)
      .populate('userId', 'name email role');

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Check if user has permission to access this specific report
    if (req.user.role !== 'admin' && report.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. You can only view your own reports." 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: report 
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch report",
      error: error.message 
    });
  }
};

// Update a report
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reportField, linkField, attendance } = req.body;

    // Allow all authenticated users to update reports
    // const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller', 'hr'];
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, telecaller, and HR roles can update reports." 
    //   });
    // }

    // Check if user is trying to update attendance (only admin and manager can do this)

    if (attendance && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin and manager can update attendance information." 
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Check if user has permission to update this specific report
    if (req.user.role !== 'admin' && report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. You can only update your own reports." 
      });
    }

    // Validate required fields
    if (reportField !== undefined && !reportField) {
      return res.status(400).json({ 
        success: false, 
        message: "Report field is required." 
      });
    }

    // Handle file uploads
    let updatedUploadFiles = report.uploadFiles || [];
    
    // If new files are being uploaded
    if (req.files && req.files.length > 0) {
      // Delete old files from S3 if they exist
      for (const oldFile of updatedUploadFiles) {
        try {
          const key = oldFile.fileUrl.split(".amazonaws.com/")[1]; // Extract key from URL
          await deleteFileFromS3(key);
        } catch (deleteError) {
          console.error("Error deleting old file from S3:", deleteError);
          // Continue even if old file deletion fails
        }
      }
      
      // Upload new files
      updatedUploadFiles = [];
      for (const file of req.files) {
        try {
          const result = await uploadFileToS3(file, 'reports');
          updatedUploadFiles.push({
            fileName: file.originalname,
            fileUrl: result.Location,
            fileType: file.mimetype
          });
        } catch (uploadError) {
          console.error("Error uploading file to S3:", uploadError);
          return res.status(500).json({ 
            success: false, 
            message: "Failed to upload file to S3",
            error: uploadError.message 
          });
        }
      }
    }

    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      id,
      {
        reportField: reportField !== undefined ? reportField : report.reportField,
        linkField: linkField !== undefined ? linkField : report.linkField,
        uploadFiles: updatedUploadFiles,
        attendance: attendance ? {
          date: attendance.date ? new Date(attendance.date) : report.attendance.date,
          morningTime: attendance.morningTime !== undefined ? attendance.morningTime : report.attendance.morningTime,
          eveningTime: attendance.eveningTime !== undefined ? attendance.eveningTime : report.attendance.eveningTime
        } : report.attendance,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email role');

    res.status(200).json({ 
      success: true, 
      message: "Report updated successfully",
      data: updatedReport 
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update report",
      error: error.message 
    });
  }
};

// Delete a report (only admin can delete)
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin can delete reports." 
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Delete associated files from S3
    for (const file of report.uploadFiles) {
      try {
        const key = file.fileUrl.split(".amazonaws.com/")[1]; // Extract key from URL
        await deleteFileFromS3(key);
      } catch (deleteError) {
        console.error("Error deleting file from S3:", deleteError);
        // Continue even if file deletion fails
      }
    }

    await Report.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: "Report deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete report",
      error: error.message 
    });
  }
};

// Get reports by date range
export const getReportsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Allow all authenticated users to view reports
    // const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller', 'hr'];
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, telecaller, and HR roles can view reports." 
    //   });
    // }

    // Parse dates and set proper start/end of days
    let start, end;
    if (startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of the day
    } else {
      start = new Date(0); // Beginning of time if not provided
    }
    
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
    } else {
      end = new Date(); // Current time if not provided
    }

    let reports;
    
    // Admin can view all reports in date range, others can only view their own
    if (req.user.role === 'admin') {
      reports = await Report.find({
        'attendance.date': { $gte: start, $lte: end }
      })
      .populate('userId', 'name email role')
      .sort({ 'attendance.date': -1, createdAt: -1 });
    } else {
      reports = await Report.find({
        userId: req.user._id,
        'attendance.date': { $gte: start, $lte: end }
      })
      .populate('userId', 'name email role')
      .sort({ 'attendance.date': -1, createdAt: -1 });
    }

    res.status(200).json({ 
      success: true, 
      data: reports,
      count: reports.length
    });
  } catch (error) {
    console.error("Error fetching reports by date range:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch reports by date range",
      error: error.message 
    });
  }
};

// Get all team members for name filter
export const getAllTeamMembers = async (req, res) => {
  try {
    // Allow all authenticated users to view team members
    // const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller', 'hr'];
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, telecaller, and HR roles can view team members." 
    //   });
    // }

    // Get all team members
    const teamMembers = await Team.find({}, 'name email role')
      .sort({ name: 1 });

    // Format the response
    const formattedMembers = teamMembers.map(member => ({
      _id: member._id,
      name: member.name || member.email.split('@')[0],
      email: member.email,
      role: member.role
    }));

    res.status(200).json({ 
      success: true, 
      data: formattedMembers,
      count: formattedMembers.length
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch team members",
      error: error.message 
    });
  }
};

// Get attendance statistics for all users
export const getAttendanceStats = async (req, res) => {
  try {
    // Only allow admin to view attendance stats for all users
    const allowedRoles = ['admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin can view attendance stats." 
      });
    }

    let reports;
    
    // Admin can view stats for all users
    reports = await Report.find()
      .populate({
        path: 'userId',
        select: 'name email role',
        options: { strictPopulate: false } // Don't throw error if ref doesn't exist
      })
      .sort({ createdAt: -1 });

    // Calculate attendance statistics
    const stats = {};
    
    reports.forEach(report => {
      // Handle userId depending on whether it's populated or just an ObjectId string
      let userId, userName;
      
      if (report.userId && typeof report.userId === 'object') {
        // userId is populated as an object
        userId = report.userId._id ? report.userId._id.toString() : (report.userId.toString() || 'unknown');
        userName = report.userId.name || report.userId.email?.split('@')[0] || 'Unknown';
      } else {
        // userId is just an ObjectId string
        userId = report.userId ? report.userId.toString() : 'unknown';
        userName = report.userName && report.userName.split('@')[0] || 'Unknown';
      }
      
      if (!stats[userId]) {
        stats[userId] = {
          _id: userId,
          name: userName,
          presentDays: 0,
          absentDays: 0,
          totalDays: 0
        };
      }
      
      // Count as present if there's a report with attendance date
      if (report.attendance && report.attendance.date) {
        stats[userId].presentDays += 1;
      } else {
        stats[userId].absentDays += 1;
      }
      
      stats[userId].totalDays += 1;
    });

    res.status(200).json({ 
      success: true, 
      data: stats,
      count: Object.keys(stats).length
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch attendance stats",
      error: error.message 
    });
  }
}
