import Appointment from "../models/AppointmentModel.js";
import Doctor from "../models/DoctorModel.js";

// Time slots a doctor offers (Phase 5 will let each doctor customise these)
export const ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(d).getTime());
const todayStr = () => new Date().toISOString().split("T")[0];

// POST /api/appointments/book   body: { docId, slotDate: "YYYY-MM-DD", slotTime: "HH:mm" }
export const bookAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { docId, slotTime, slotDate } = req.body;

    if (!docId || !slotDate || !slotTime) {
      return res.status(400).json({ success: false, message: "Doctor, date and time are required." });
    }
    if (!isValidDate(slotDate) || slotDate < todayStr()) {
      return res.status(400).json({ success: false, message: "Please choose a valid upcoming date." });
    }
    if (!ALL_SLOTS.includes(slotTime)) {
      return res.status(400).json({ success: false, message: "Invalid time slot." });
    }

    const docData = await Doctor.findById(docId).select("-slots_booked");
    if (!docData || !docData.available) {
      return res.status(404).json({ success: false, message: "Doctor not available" });
    }

    const existing = await Appointment.findOne({
      docId, slotDate, slotTime,
      status: { $ne: "Cancelled" }, // $ne = not equal
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "This time slot is already booked for this doctor." });
    }

    await Appointment.create({
      userId,
      docId,
      userData: { _id: req.user._id, name: req.user.name, email: req.user.email },
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      status: "Pending",
    });

    res.status(201).json({ success: true, message: "Appointment booked successfully" });
  } catch (error) {
    // The unique index (see AppointmentModel) catches two people booking at the same instant
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "This time slot was just booked by someone else." });
    }
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/appointments/list  (logged-in patient's own appointments)
export const getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/appointments/booked?docId=...&slotDate=YYYY-MM-DD  (public)
// Returns which slots are taken so the UI can disable them.
export const getBookedSlots = async (req, res) => {
  try {
    const { docId, slotDate } = req.query;
    if (!docId || !slotDate) {
      return res.status(400).json({ success: false, message: "docId and slotDate are required." });
    }
    const rows = await Appointment.find({ docId, slotDate, status: { $ne: "Cancelled" } }).select("slotTime");
    res.status(200).json({ success: true, booked: rows.map((r) => r.slotTime), allSlots: ALL_SLOTS });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/appointments/cancel/:appointmentId
export const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Only the patient who booked it (or an admin) can cancel it
    if (appointment.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this appointment" });
    }
    if (appointment.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Appointment is already cancelled" });
    }

    appointment.status = "Cancelled";
    await appointment.save();
    return res.status(200).json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
