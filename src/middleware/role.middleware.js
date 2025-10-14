import Team from "../models/team.model.js";

// Middleware to check if user has admin role
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin rights required." });
  }
  next();
};

// Middleware to check if user has admin or manager role
export const isAdminOrManager = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "Access denied. Admin or Manager rights required." });
  }
  next();
};

// Middleware to check if user has admin, manager, or sales role
export const isAuthenticated = (req, res, next) => {
  if (!req.user.role) {
    return res.status(403).json({ message: "Access denied. Authentication required." });
  }
  next();
};