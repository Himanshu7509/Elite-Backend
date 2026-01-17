import Team from "../models/team.model.js";
import bcrypt from "bcryptjs";

// Create a new team member
export const createTeamMember = async (req, res) => {
  try {
    // Only admin can create team members
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can create team members." });
    }

    const { name, email, password, role } = req.body;

    const existing = await Team.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMember = new Team({
      name,
      email,
      password: hashedPassword,
      role: role || "sales",
    });

    await newMember.save();
    res.status(201).json({ success: true, data: newMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all team members
export const getAllTeamMembers = async (req, res) => {
  try {
    // Admin, manager, counselor, and telecaller can see all team members
    if (req.user.role !== "admin" && req.user.role !== "manager" && req.user.role !== "counsellor" && req.user.role !== "telecaller") {
      return res.status(403).json({ message: "Access denied. Admin, Manager, Counselor, or Telecaller rights required." });
    }

    // Only include password for admin users
    let selectFields = "name email role assignedLeads createdAt updatedAt";
    if (req.user.role === "admin") {
      selectFields = "name email role password assignedLeads createdAt updatedAt"; // Include password for admin
    }

    const members = await Team.find()
      .select(selectFields)
      .populate({
        path: "assignedLeads",
        select: "fullName email phoneNo status assignedTo assignedBy assignedByName",
        populate: [
          {
            path: "assignedTo",
            select: "name email"
          },
          {
            path: "assignedBy",
            select: "name email"
          }
        ]
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a team member
export const updateTeamMember = async (req, res) => {
  try {
    // Only admin can update team members
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can update team members." });
    }

    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // Prepare update data
    const updateData = { name, email, role };

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update the team member
    const updatedMember = await Team.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedMember) {
      return res.status(404).json({ message: "Team member not found" });
    }

    res.status(200).json({ success: true, data: updatedMember });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a team member
export const deleteTeamMember = async (req, res) => {
  try {
    // Only admin can delete team members
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can delete team members." });
    }

    const { id } = req.params;
    const deleted = await Team.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Team member not found" });
    res.status(200).json({ success: true, message: "Team member deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get team member by ID
export const getTeamMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only include password for admin users
    let selectFields = "name email role assignedLeads createdAt updatedAt";
    if (req.user.role === "admin") {
      selectFields = "name email role password assignedLeads createdAt updatedAt"; // Include password for admin
    }
    
    const member = await Team.findById(id).select(selectFields).populate({
      path: "assignedLeads",
      select: "fullName email phoneNo status assignedTo assignedBy assignedByName",
      populate: [
        {
          path: "assignedTo",
          select: "name email"
        },
        {
          path: "assignedBy",
          select: "name email"
        }
      ]
    });
    
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

