import express from "express";
import authUser from "../middleware/authUser.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
} from "../controller/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", authUser, getProfile);

export default router;
