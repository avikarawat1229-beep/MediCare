import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Doctor from "../models/DoctorModel.js";
import User from "../models/UserModel.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// GET /api/doctors  (public) — optional ?speciality=Cardiologist to filter
export const getAllDoctors = async (req, res) => {
  try {
    const { speciality } = req.query;
    const filter = speciality ? { speciality } : {};

    const doctors = await Doctor.find(filter).select("-slots_booked");
    return res.status(200).json({ success: true, doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/doctors/:id  (public)
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-slots_booked");
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/doctors/login
// Doctors share the User collection (role: "doctor") rather than having their
// own separate password — this checks that role, then returns their Doctor profile too.
export const doctorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: "doctor" });
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

    const doctorProfile = await Doctor.findOne({ userId: user._id }).select("-slots_booked");

    const token = jwt.sign(
      { id: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(200).cookie("token", token, cookieOptions).json({
      success: true,
      message: `Welcome back Dr. ${user.name}`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      doctor: doctorProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/doctors/availability  (doctor only — attach authUser + requireRole('doctor') in routes)
export const changeAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }
    doctor.available = !doctor.available;
    await doctor.save();
    return res.status(200).json({ success: true, available: doctor.available });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
