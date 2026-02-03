const jwt = require("jsonwebtoken");

// ============================================
// AUTH MIDDLEWARE
// Verifies JWT token and adds user to request
// ============================================
const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ============================================
// ROLE-BASED ACCESS MIDDLEWARE
// Check if user has required role
// ============================================
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Access denied",
        message: "You don't have permission to perform this action"
      });
    }

    next();
  };
};

// Role constants for easy use
const ROLES = {
  MANAGER: 'manager',
  OPERATOR: 'operator',
  ACCOUNTANT: 'accountant'
};

module.exports = { 
  authMiddleware, 
  requireRole,
  ROLES 
};