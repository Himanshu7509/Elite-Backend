import jwt from "jsonwebtoken";
import Team from "../models/team.model.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied, token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { email, role, _id }
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Protect middleware - checks if user is authenticated
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied, token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user details from database to ensure they still exist
    const user = await Team.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: "Access denied, user no longer exists" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Authorize middleware - checks if user has required roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied, authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied, requires one of these roles: ${roles.join(', ')}` });
    }
    
    next();
  };
};

// Optional authentication middleware - verifies token if provided, but doesn't require it
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided, continue without authentication
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { email, role, _id }
    next();
  } catch (error) {
    // Invalid token, continue without authentication
    next();
  }
};