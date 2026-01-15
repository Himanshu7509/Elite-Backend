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
    
    // Check if user has permission to create reports
    const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, and telecaller roles can create reports."
      });
    }



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
    // Check if user has permission to view reports
    const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, and telecaller roles can view reports." 
      });
    }

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
      // Support both full email and username (before @) for name filter
      query.$or = [
        { 'userId.name': { $regex: req.query.userName, $options: 'i' } },
        { 'userName': { $regex: req.query.userName, $options: 'i' } }
      ];
    }
    
    // Handle date filtering
    const dateConditions = [];
    
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
        dateConditions.push({
          $expr: { $eq: [{ $dayOfWeek: "$attendance.date" }, dayValue] }
        });
      }
    }
    
    // Handle date range filtering
    if (req.query.startDate && req.query.endDate) {
      dateConditions.push({
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      });
    } else if (req.query.startDate) {
      dateConditions.push({ $gte: new Date(req.query.startDate) });
    } else if (req.query.endDate) {
      // Set end of day for endDate
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      dateConditions.push({ $lte: endDate });
    }
    
    // Apply date conditions to query
    if (dateConditions.length > 0) {
      query['attendance.date'] = { $exists: true };
      if (dateConditions.length === 1) {
        Object.assign(query['attendance.date'], dateConditions[0]);
      } else {
        // Combine multiple conditions with $and
        query['attendance.date'].$and = dateConditions;
      }
    }

    // Get total count
    const totalCount = await Report.countDocuments(query);
    
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

    // Check if user has permission to view reports
    const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, and telecaller roles can view reports." 
      });
    }

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

    // Check if user has permission to update reports
    const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, and telecaller roles can update reports." 
      });
    }

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

    // Check if user has permission to view reports
    const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, and telecaller roles can view reports." 
      });
    }

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(0); // Beginning of time if not provided
    const end = endDate ? new Date(endDate) : new Date(); // Current date if not provided

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

// Get attendance statistics for all users
export const getAttendanceStats = async (req, res) => {
  try {
    // Check if user has permission to view attendance stats
    const allowedRoles = ['admin', 'developer', 'analyst', 'marketing', 'sales', 'counsellor', 'telecaller'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin, developer, analyst, marketing, sales, counsellor, and telecaller roles can view attendance stats." 
      });
    }

    let reports;
    
    // Admin can view stats for all users, others can only view their own
    if (req.user.role === 'admin') {
      reports = await Report.find()
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 });
    } else {
      reports = await Report.find({ userId: req.user._id })
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 });
    }

    // Calculate attendance statistics
    const stats = {};
    
    reports.forEach(report => {
      const userId = report.userId._id || report.userId;
      const userName = report.userId?.name || (report.userName && report.userName.split('@')[0]) || 'Unknown';
      
      if (!stats[userId]) {
        stats[userId] = {
          name: userName,
          presentDays: 0,
          absentDays: 0,
          totalDays: 0
        };
      }
      
      // Count as present if there's a report with attendance date
      if (report.attendance?.date) {
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
};