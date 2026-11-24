import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

const app = express();

app.use(express.json());
app.use(cookieParser()); // needed so req.cookies.token works in authUser

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // frontend
    credentials: true, // allow the httpOnly cookie to be sent
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/api/health", (req, res) => res.json({ success: true, message: "API running" }));

export default app;
