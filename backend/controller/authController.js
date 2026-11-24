import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body; // role is NEVER taken from the client

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All Fields Are Required."
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "patient", // doctors/admins are created by the admin/seed script only
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(200).cookie("token", token, cookieOptions).json({
      success: true,
      message: `Welcome back ${user.name}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", {
      ...cookieOptions,
      maxAge: 0,
    }).json({
      success: true,
      message: "User Logged Out Successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

// Requires authUser middleware to have run first (sets req.user)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
