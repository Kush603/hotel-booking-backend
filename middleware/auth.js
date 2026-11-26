const jwt = require("jsonwebtoken");
const User = require("../models/Userschema");

// Middleware to protect routes (require authenticated user)
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found or token has expired",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error("Auth Token Error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is missing. Please provide a Bearer token",
    });
  }
};

// Optional auth: attaches user if token is provided, otherwise proceeds as guest
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Proceed without user
      req.user = null;
    }
  }
  next();
};

// Role-based authorization middleware (e.g. authorize('admin', 'hotel_owner'))
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user ? req.user.role : "guest"}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
};
