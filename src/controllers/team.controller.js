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
    // Only admin and manager can see all team members
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied. Admin or Manager rights required." });
    }

    const members = await Team.find()
      .select("-password")
      .populate("assignedLeads", "fullName email phoneNo status");
    
    res.status(200).json({ success: true, data: members });
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
    const member = await Team.findById(id).select("-password");
    
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};