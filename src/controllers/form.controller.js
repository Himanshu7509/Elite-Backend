import Form from "../models/form.model.js";
import Team from "../models/team.model.js";
import { uploadFileToS3 } from "../utils/s3Upload.js";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Create a new lead/form entry
export const createForm = async (req, res) => {
  try {
    // Prepare the form data with tracking information
    const formData = { ...req.body };
    
    // Handle resume file upload if present
    if (req.file) {
      try {
        const uploadedFile = await uploadFileToS3(req.file, 'resumes');
        formData.resume = uploadedFile.Location;
      } catch (uploadError) {
        console.error("Error uploading resume:", uploadError);
        return res.status(400).json({ message: "Failed to upload resume: " + uploadError.message });
      }
    }
    
    // If user is authenticated, track who created the lead
    if (req.user) {
      // Set the source based on user role
      formData.source = req.user.role;
      
      // Get user details for tracking
      let creatorInfo = {
        email: req.user.email,
        role: req.user.role
      };
      
      // If it's a database user (not static), get additional info
      if (req.user._id) {
        const teamMember = await Team.findById(req.user._id);
        if (teamMember) {
          creatorInfo.userId = teamMember._id;
          creatorInfo.name = teamMember.name;
          
          // If a sales or marketing person is creating a lead, automatically assign it to them
          if (req.user.role === "sales" || req.user.role === "marketing" || req.user.role === "counsellor" || req.user.role === "telecaller") {
            formData.assignedTo = teamMember._id;
            formData.assignedBy = teamMember._id;
            formData.assignedByName = teamMember.name;
          }
        }
      } else {
        // For static users (admin, manager, sales), use email as name
        creatorInfo.name = req.user.email;
      }
      
      formData.createdBy = creatorInfo;
    } else {
      // If no user is authenticated, it's likely from website
      formData.source = "website";
      formData.createdBy = {
        email: "website",
        role: "website",
        name: "Website Submission"
      };
    }
    
    const newForm = new Form(formData);
    const savedForm = await newForm.save();
    
    // If this is a sales or marketing person's lead, update their assigned leads
    if (req.user && (req.user.role === "sales" || req.user.role === "marketing" || req.user.role === "counsellor" || req.user.role === "telecaller") && req.user._id) {
      const teamMember = await Team.findById(req.user._id);
      if (teamMember) {
        await Team.findByIdAndUpdate(teamMember._id, {
          $addToSet: { assignedLeads: savedForm._id },
        });
      }
    }
    
    res.status(201).json(savedForm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Get all leads based on user role
export const getForms = async (req, res) => {
  try {
    const user = req.user; // populated from verifyToken middleware
    let filter = {};

    if (user.role === "admin" || user.role === "manager") {
      // Admin and manager can see all leads
      filter = {};
    } else if (user.role === "counsellor" || user.role === "telecaller") {
      // Counsellor and Telecaller can see all leads
      filter = {};
    } else if (user.role === "sales" || user.role === "marketing") {
      // Sales and Marketing can see:
      // 1. Leads assigned to them
      // 2. Unassigned leads (not assigned to anyone)
      // But NOT leads assigned to other sales or marketing persons
      const teamMember = await Team.findOne({ email: user.email });

      if (!teamMember) {
        return res.status(404).json({ message: "Sales or Marketing team member not found" });
      }

      // Filter to show leads assigned to this member OR unassigned leads
      filter = {
        $or: [
          { assignedTo: teamMember._id }, // Leads assigned to this sales or marketing person
          { assignedTo: null } // Unassigned leads
        ]
      };
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const forms = await Form.find(filter)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all leads (unassigned and assigned) - for admin and manager
export const getAllForms = async (req, res) => {
  try {
    // Only admin and manager can see all leads
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied. Admin or Manager rights required." });
    }

    const forms = await Form.find()
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get unassigned leads - for admin and manager to assign
export const getUnassignedForms = async (req, res) => {
  try {
    // Only admin and manager can see unassigned leads
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied. Admin or Manager rights required." });
    }

    const forms = await Form.find({ assignedTo: null })
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get leads assigned to a specific sales or marketing member - for admin and manager
export const getAssignedForms = async (req, res) => {
  try {
    // Only admin and manager can see assigned leads
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied. Admin or Manager rights required." });
    }

    const { salesId } = req.params;
    const forms = await Form.find({ assignedTo: salesId })
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update form details (partial update)
export const updateFormDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if user has permission to update this form
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // For sales and marketing, they can only update forms assigned to them
    // Counselors and telecallers can update any form
    if (req.user.role === "sales" || req.user.role === "marketing") {
      const teamMember = await Team.findOne({ email: req.user.email });
      if (!teamMember || form.assignedTo?.toString() !== teamMember._id.toString()) {
        return res.status(403).json({ message: "Access denied. You can only update leads assigned to you." });
      }
    }

    // Handle resume file upload if present
    if (req.file) {
      try {
        const uploadedFile = await uploadFileToS3(req.file, 'resumes');
        updateData.resume = uploadedFile.Location;
      } catch (uploadError) {
        console.error("Error uploading resume:", uploadError);
        return res.status(400).json({ message: "Failed to upload resume: " + uploadError.message });
      }
    }

    // Add updatedBy tracking information
    if (req.user) {
      let updaterInfo = {
        email: req.user.email,
        role: req.user.role
      };

      // If it's a database user (not static), get additional info
      if (req.user._id) {
        const teamMember = await Team.findById(req.user._id);
        if (teamMember) {
          updaterInfo.userId = teamMember._id;
          updaterInfo.name = teamMember.name;
        }
      } else {
        // For static users (admin, manager, sales), use email as name
        updaterInfo.name = req.user.email;
      }

      updateData.updatedBy = updaterInfo;
    }

    // Admin and manager can update any form
    // Update only the provided fields
    const updatedForm = await Form.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Form details updated successfully",
      updatedForm,
    });
  } catch (error) {
    console.error("Error updating form:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Mark a lead as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to mark this form as read
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // For sales and marketing, they can only mark forms assigned to them as read
    // Counselors and telecallers can mark any form as read
    if (req.user.role === "sales" || req.user.role === "marketing") {
      const teamMember = await Team.findOne({ email: req.user.email });
      if (!teamMember || form.assignedTo?.toString() !== teamMember._id.toString()) {
        return res.status(403).json({ message: "Access denied. You can only mark leads assigned to you as read." });
      }
    }

    // Prepare update data with tracking information
    const updateData = { isRead: true, status: "read" };
    
    // Add updatedBy tracking information
    if (req.user) {
      let updaterInfo = {
        email: req.user.email,
        role: req.user.role
      };

      // If it's a database user (not static), get additional info
      if (req.user._id) {
        const teamMember = await Team.findById(req.user._id);
        if (teamMember) {
          updaterInfo.userId = teamMember._id;
          updaterInfo.name = teamMember.name;
        }
      } else {
        // For static users (admin, manager, sales), use email as name
        updaterInfo.name = req.user.email;
      }

      updateData.updatedBy = updaterInfo;
    }

    const updatedForm = await Form.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    res.status(200).json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update interest status (interested / not_interested)
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "interested" or "not_interested"

    const valid = ["interested", "not_interested"];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Check if user has permission to update status of this form
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // For sales and marketing, they can only update status of forms assigned to them
    // Counselors and telecallers can update status of any form
    if (req.user.role === "sales" || req.user.role === "marketing") {
      const teamMember = await Team.findOne({ email: req.user.email });
      if (!teamMember || form.assignedTo?.toString() !== teamMember._id.toString()) {
        return res.status(403).json({ message: "Access denied. You can only update status of leads assigned to you." });
      }
    }

    // Prepare update data with tracking information
    const updateData = { status };
    
    // Add updatedBy tracking information
    if (req.user) {
      let updaterInfo = {
        email: req.user.email,
        role: req.user.role
      };

      // If it's a database user (not static), get additional info
      if (req.user._id) {
        const teamMember = await Team.findById(req.user._id);
        if (teamMember) {
          updaterInfo.userId = teamMember._id;
          updaterInfo.name = teamMember.name;
        }
      } else {
        // For static users (admin, manager, sales), use email as name
        updaterInfo.name = req.user.email;
      }

      updateData.updatedBy = updaterInfo;
    }

    const updatedForm = await Form.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignLead = async (req, res) => {
  try {
    // Admin, manager, counselor, and telecaller can assign leads
    if (req.user.role !== "admin" && req.user.role !== "manager" && req.user.role !== "counsellor" && req.user.role !== "telecaller") {
      return res.status(403).json({ message: "Access denied. Only admin, manager, counselor, or telecaller can assign leads." });
    }

    const { id } = req.params; // Lead ID
    const { assignedTo, assignedBy } = req.body;

    // Find the team member who is receiving the lead
    const assignedUser = await Team.findOne({ email: assignedTo });
    if (!assignedUser) {
      return res.status(404).json({ message: "Assigned member not found" });
    }

    // Determine who is doing the assignment
    let assignedByUser = null;
    let assignedById = null;
    let assignedByName = null;
    
    // If assignedBy is provided in the request, use it
    if (assignedBy) {
      // Check if the assignedBy is a team member
      assignedByUser = await Team.findOne({ email: assignedBy });
      if (assignedByUser) {
        assignedById = assignedByUser._id;
        assignedByName = assignedByUser.name;
      } else {
        // If not a team member, it might be an admin
        // Check if it matches the authenticated user
        if (req.user.email === assignedBy) {
          assignedByName = `Admin (${assignedBy})`;
        } else {
          assignedByName = assignedBy;
        }
      }
    } else {
      // If no assignedBy provided, use the authenticated user
      assignedBy = req.user.email;
      if (req.user.role === "admin") {
        assignedByName = `Admin (${req.user.email})`;
      } else {
        // For managers, get their name from the team collection
        const manager = await Team.findOne({ email: req.user.email });
        assignedByName = manager ? manager.name : req.user.email;
      }
    }

    // Find the lead before updating (to check for previous assignment)
    const oldForm = await Form.findById(id);
    if (!oldForm) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // ✅ Update the Form with the new assignment
    const updateData = {
      assignedTo: assignedUser._id,
      assignedBy: assignedById, // Store the ID if it's a team member, otherwise null
      assignedByName: assignedByName, // Store the name for display purposes
    };
    
    // Add updatedBy tracking information
    if (req.user) {
      let updaterInfo = {
        email: req.user.email,
        role: req.user.role
      };

      // If it's a database user (not static), get additional info
      if (req.user._id) {
        const teamMember = await Team.findById(req.user._id);
        if (teamMember) {
          updaterInfo.userId = teamMember._id;
          updaterInfo.name = teamMember.name;
        }
      } else {
        // For static users (admin, manager, sales), use email as name
        updaterInfo.name = req.user.email;
      }

      updateData.updatedBy = updaterInfo;
    }

    const updatedForm = await Form.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("assignedTo assignedBy", "name email");

    // ✅ Update the assigned team member's record
    await Team.findByIdAndUpdate(assignedUser._id, {
      $addToSet: { assignedLeads: updatedForm._id },
    });

    // ✅ Remove from old assignee if reassigned
    if (oldForm.assignedTo && oldForm.assignedTo.toString() !== assignedUser._id.toString()) {
      await Team.findByIdAndUpdate(oldForm.assignedTo, {
        $pull: { assignedLeads: updatedForm._id },
      });
    }

    res.status(200).json({
      message: "Lead assigned successfully",
      lead: updatedForm,
    });
  } catch (error) {
    console.error("Error assigning lead:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a lead - only admin can delete leads
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can delete leads." });
    }

    // Find the lead
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // If the lead is assigned to a sales or marketing person, remove it from their assigned leads
    if (form.assignedTo) {
      await Team.findByIdAndUpdate(form.assignedTo, {
        $pull: { assignedLeads: form._id },
      });
    }

    // Delete the lead
    await Form.findByIdAndDelete(id);

    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Export the upload middleware
export { upload };
