import Form from "../models/form.model.js";
import Team from "../models/team.model.js";

// ✅ Create a new lead/form entry
export const createForm = async (req, res) => {
  try {
    const formData = new Form(req.body);
    const savedForm = await formData.save();
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
    } else if (user.role === "sales") {
      // Sales can only see leads assigned to them
      const teamMember = await Team.findOne({ email: user.email });

      if (!teamMember) {
        return res.status(404).json({ message: "Sales team member not found" });
      }

      // Only show leads assigned to this member
      filter = { assignedTo: teamMember._id };
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

// ✅ Get leads assigned to a specific sales member - for admin and manager
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
    const updateData = req.body;

    // Check if user has permission to update this form
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // For sales, they can only update forms assigned to them
    if (req.user.role === "sales") {
      const teamMember = await Team.findOne({ email: req.user.email });
      if (!teamMember || form.assignedTo?.toString() !== teamMember._id.toString()) {
        return res.status(403).json({ message: "Access denied. You can only update leads assigned to you." });
      }
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

    // For sales, they can only mark forms assigned to them as read
    if (req.user.role === "sales") {
      const teamMember = await Team.findOne({ email: req.user.email });
      if (!teamMember || form.assignedTo?.toString() !== teamMember._id.toString()) {
        return res.status(403).json({ message: "Access denied. You can only mark leads assigned to you as read." });
      }
    }

    const updatedForm = await Form.findByIdAndUpdate(
      id,
      { isRead: true, status: "read" },
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

    // For sales, they can only update status of forms assigned to them
    if (req.user.role === "sales") {
      const teamMember = await Team.findOne({ email: req.user.email });
      if (!teamMember || form.assignedTo?.toString() !== teamMember._id.toString()) {
        return res.status(403).json({ message: "Access denied. You can only update status of leads assigned to you." });
      }
    }

    const updatedForm = await Form.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignLead = async (req, res) => {
  try {
    // Only admin and manager can assign leads
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied. Only admin or manager can assign leads." });
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
    const updatedForm = await Form.findByIdAndUpdate(
      id,
      {
        assignedTo: assignedUser._id,
        assignedBy: assignedById, // Store the ID if it's a team member, otherwise null
        assignedByName: assignedByName, // Store the name for display purposes
      },
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