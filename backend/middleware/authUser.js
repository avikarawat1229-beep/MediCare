import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

const authUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Please Login First." });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decode.id).select("-password"); // never keep the hash on req.user
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found. Please login again." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid Token." });
  }
};

// Use AFTER authUser to restrict a route to specific roles,
// e.g. router.patch('/availability', authUser, requireRole('doctor'), changeAvailability)
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to perform this action.",
    });
  }
  next();
};

export default authUser;
