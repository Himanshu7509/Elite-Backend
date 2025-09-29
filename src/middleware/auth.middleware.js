import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; 

  // Enhanced debugging
  console.log("=== AUTH DEBUG INFO ===");
  console.log("Auth Header:", authHeader);
  console.log("Token:", token ? `${token.substring(0, 10)}...` : "None");
  console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
  console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length || 0);
  console.log("Request URL:", req.url);
  console.log("Request Method:", req.method);
  console.log("=== END AUTH DEBUG ===");

  if (!token) {
    return res.status(403).json({ 
      message: "No token provided",
      debug: {
        authHeader: authHeader,
        hasToken: !!token
      }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log("Token decoded successfully:", decoded);
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    console.error("Token verification error code:", error.name);
    return res.status(401).json({ 
      message: "Invalid or expired token",
      error: error.message,
      errorCode: error.name
    });
  }
};