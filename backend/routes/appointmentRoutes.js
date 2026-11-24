import express from "express";
import authUser from "../middleware/authUser.js";
import {
  bookAppointment,
  getUserAppointments,
  cancelAppointment,
  getBookedSlots,
} from "../controller/appointmentController.js";

const router = express.Router();

router.get("/booked", getBookedSlots); // public: which slots are taken
router.post("/book", authUser, bookAppointment);
router.get("/list", authUser, getUserAppointments);
router.patch("/cancel/:appointmentId", authUser, cancelAppointment);

export default router;
