import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    slotDate: {
      type: String,
      required: true,
    },
    slotTime: {
      type: String,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
    docData: {
      type: Object,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payment: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

// DB-level guard against double booking: one active appointment per doctor + date + time.
// Cancelled appointments are excluded, so a cancelled slot can be booked again.
appointmentSchema.index(
  { docId: 1, slotDate: 1, slotTime: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["Pending", "Confirmed", "Completed"] } } }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
