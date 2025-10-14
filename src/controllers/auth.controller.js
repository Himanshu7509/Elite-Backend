import jwt from "jsonwebtoken";
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
        role: "admin"
      });
    }

    // --- Manager Login ---
    if (Auth.manager.emails.includes(email) && password === Auth.sales.password) {
      const token = jwt.sign({ email, role: "manager" }, JWT_SECRET, { expiresIn: "24h" });

      return res.status(200).json({
        message: "Manager login successful",
        token,
        role: "manager"
      });
    }

    // --- Sales Team Login ---
    if (Auth.sales.emails.includes(email) && password === Auth.sales.password) {
      const token = jwt.sign({ email, role: "sales" }, JWT_SECRET, { expiresIn: "24h" });

      return res.status(200).json({
        message: "Sales team login successful",
        token,
        role: "sales"
      });
    }

    // --- Invalid credentials ---
    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};