import express from "express";
import authUser, { requireRole } from "../middleware/authUser.js";
import {
  getAllDoctors,
  getDoctorById,
  doctorLogin,
  changeAvailability,
} from "../controller/doctorController.js";

const router = express.Router();

// Public
router.get("/", getAllDoctors);          // GET /api/doctors?speciality=Cardiologist
router.get("/:id", getDoctorById);       // GET /api/doctors/:id
router.post("/login", doctorLogin);      // POST /api/doctors/login

// Doctor-only
router.patch("/availability", authUser, requireRole("doctor"), changeAvailability);

export default router;
