import jwt from "jsonwebtoken";

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // If no authorization header, continue without user info
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { email, role, _id }
  } catch (error) {
    // If token is invalid, continue without user info
    req.user = null;
  }
  
  next();
};