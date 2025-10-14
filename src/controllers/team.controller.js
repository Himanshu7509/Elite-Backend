import Team from "../models/team.model.js";
import bcrypt from "bcryptjs";

// Create a new team member
export const createTeamMember = async (req, res) => {
  try {
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
    const { id } = req.params;
    const deleted = await Team.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Team member not found" });
    res.status(200).json({ success: true, message: "Team member deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
