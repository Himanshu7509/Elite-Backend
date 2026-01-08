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

// Middleware to check if user has a valid role (any authenticated user)
export const isAuthenticated = (req, res, next) => {
  if (!req.user.role) {
    return res.status(403).json({ message: "Access denied. Authentication required." });
  }
  next();
};

// Middleware to check if user has read access (admin, developer, analyst, marketing, sales, counsellor, telecaller)
export const hasReadAccess = (req, res, next) => {
  const allowedRoles = ["admin", "developer", "analyst", "marketing", "sales", "counsellor", "telecaller"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied. Read access required." });
  }
  next();
};