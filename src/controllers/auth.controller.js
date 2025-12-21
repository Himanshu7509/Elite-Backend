import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Auth from "../models/auth.model.js";
import Team from "../models/team.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Admin Login ---
    if (email === Auth.admin.email && password === Auth.admin.password) {
      const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "24h" });

      return res.status(200).json({
        message: "Admin login successful",
        token,
        role: "admin",
        _id: null // Admin doesn't have an _id in the database
      });
    }

    // Manager accounts are now created dynamically through the team management system
    // No hardcoded manager login logic

    // --- Check database for team members ---
    const teamMember = await Team.findOne({ email });
    if (teamMember) {
      const isPasswordValid = await bcrypt.compare(password, teamMember.password);
      if (isPasswordValid) {
        const token = jwt.sign({ email, role: teamMember.role, _id: teamMember._id }, JWT_SECRET, { expiresIn: "24h" });

        return res.status(200).json({
          message: `${teamMember.role} login successful`,
          token,
          role: teamMember.role,
          _id: teamMember._id // Include the _id for database users
        });
      }
    }

    // --- Invalid credentials ---
    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};