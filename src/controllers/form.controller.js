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

// ✅ Get all leads — admin sees all, sales sees only unassigned or assigned to them
export const getForms = async (req, res) => {
  try {
    const user = req.user; // populated from verifyToken middleware
    let filter = {};

    if (user.role === "sales") {
      // Find the sales team member in the Team collection
      const teamMember = await Team.findOne({ email: user.email });

      if (!teamMember) {
        return res.status(404).json({ message: "Sales team member not found" });
      }

      // Only show leads assigned to this member or unassigned
      filter = {
        $or: [
          { assignedTo: teamMember._id },
          { assignedTo: null } // unassigned leads
        ]
      };
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


// ✅ Update form details (partial update)
export const updateFormDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Ensure form exists
    const existingForm = await Form.findById(id);
    if (!existingForm) {
      return res.status(404).json({ message: "Form not found" });
    }

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
    const updatedForm = await Form.findByIdAndUpdate(
      id,
      { isRead: true, status: "read" },
      { new: true }
    );
    if (!updatedForm) return res.status(404).json({ message: "Lead not found" });
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

    const updatedForm = await Form.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedForm) return res.status(404).json({ message: "Lead not found" });
    res.status(200).json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignLead = async (req, res) => {
  try {
    const { id } = req.params; // Lead ID
    const { assignedTo, assignedBy } = req.body;

    // Find the team member who is receiving the lead
    const assignedUser = await Team.findOne({ email: assignedTo });
    if (!assignedUser) {
      return res.status(404).json({ message: "Assigned member not found" });
    }

    // Find the team member (or admin) who is assigning
    let assignedByUser = await Team.findOne({ email: assignedBy });
    if (!assignedByUser) {
      assignedByUser = { _id: null, email: assignedBy, name: "Admin" };
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
        assignedBy: assignedByUser?._id || null,
      },
      { new: true }
    ).populate("assignedTo assignedBy", "name email");

    // ✅ Update the assigned team member’s record
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
