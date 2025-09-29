import jwt from "jsonwebtoken";
import Auth from "../models/auth.model.js";
import dbConnect from "../utils/mongodb.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const login = async (req, res) => {
  try {
    // Ensure database connection
    await dbConnect();
    
    const { email, password } = req.body;

    if (email === Auth.email && password === Auth.password) {
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "24h" });

      return res.status(200).json({
        message: "Login successful",
        token
      });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};