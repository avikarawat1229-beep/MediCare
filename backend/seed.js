// Dev-only: creates demo doctors (User with role "doctor" + Doctor profile) and one demo patient.
// Run:  npm run seed      (safe to run again — existing emails are skipped)
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./models/UserModel.js";
import Doctor from "./models/DoctorModel.js";

const DOCTOR_PASSWORD = "Doctor@123";
const PATIENT = { name: "Demo Patient", email: "patient@demo.com", password: "Patient@123" };

const doctors = [
  { name: "Dr. Richmond Herrick", email: "richmond.herrick@demo.com", speciality: "Neurosurgeon", degree: "MBBS, MS (Neurosurgery)", experience: "12 years", fees: 1500, image: "/doctors/doctor_1.jpg", about: "Experienced neurosurgeon focused on brain and spine procedures with a patient-first approach." },
  { name: "Dr. Olivia Bennett", email: "olivia.bennett@demo.com", speciality: "Cardiologist", degree: "MBBS, MD (Cardiology)", experience: "10 years", fees: 1200, image: "/doctors/doctor_2.jpg", about: "Cardiologist specialising in preventive heart care, hypertension and cardiac risk assessment." },
  { name: "Dr. Sophia Martinez", email: "sophia.martinez@demo.com", speciality: "Pediatrician", degree: "MBBS, DCH (Pediatrics)", experience: "8 years", fees: 1000, image: "/doctors/doctor_3.jpg", about: "Caring pediatrician for newborns, children and teenagers, including vaccinations and growth checks." },
  { name: "Dr. Amelia Clarke", email: "amelia.clarke@demo.com", speciality: "Dermatologist", degree: "MBBS, MD (Dermatology)", experience: "7 years", fees: 900, image: "/doctors/doctor_4.jpg", about: "Dermatologist treating acne, allergies, eczema and other skin and hair conditions." },
  { name: "Dr. Daniel Osei", email: "daniel.osei@demo.com", speciality: "Endocrinologist", degree: "MBBS, MD (Endocrinology)", experience: "9 years", fees: 1100, image: "/doctors/doctor_1.jpg", about: "Endocrinologist managing diabetes, thyroid and hormonal disorders." },
  // --- added for the Health Assessment page (it recommends these specialties) ---
  { name: "Dr. Arjun Mehta", email: "arjun.mehta@demo.com", speciality: "General Physician", degree: "MBBS, MD (General Medicine)", experience: "11 years", fees: 600, image: "/doctors/doctor_1.jpg", about: "General physician for fever, infections, everyday illnesses and first-line check-ups." },
  { name: "Dr. Priya Nair", email: "priya.nair@demo.com", speciality: "Gastroenterologist", degree: "MBBS, DM (Gastroenterology)", experience: "9 years", fees: 1300, image: "/doctors/doctor_2.jpg", about: "Treats stomach, liver and digestive conditions." },
  { name: "Dr. Kabir Rao", email: "kabir.rao@demo.com", speciality: "Pulmonologist", degree: "MBBS, MD (Pulmonology)", experience: "10 years", fees: 1200, image: "/doctors/doctor_3.jpg", about: "Specialist in asthma, chest infections and breathing problems." },
  { name: "Dr. Meera Iyer", email: "meera.iyer@demo.com", speciality: "Neurologist", degree: "MBBS, DM (Neurology)", experience: "12 years", fees: 1500, image: "/doctors/doctor_4.jpg", about: "Treats migraines, vertigo and nerve-related conditions." },
  { name: "Dr. Rohan Das", email: "rohan.das@demo.com", speciality: "Orthopedic Specialist", degree: "MBBS, MS (Orthopedics)", experience: "8 years", fees: 1000, image: "/doctors/doctor_1.jpg", about: "Bone, joint and spine care." },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  for (const d of doctors) {
    if (await User.findOne({ email: d.email })) {
      console.log("skip (exists):", d.email);
      continue;
    }
    const hash = await bcrypt.hash(DOCTOR_PASSWORD, 10);
    const user = await User.create({ name: d.name, email: d.email, password: hash, role: "doctor" });
    await Doctor.create({ ...d, userId: user._id });
    console.log("added doctor:", d.name);
  }

  if (!(await User.findOne({ email: PATIENT.email }))) {
    await User.create({ name: PATIENT.name, email: PATIENT.email, password: await bcrypt.hash(PATIENT.password, 10), role: "patient" });
    console.log("added demo patient:", PATIENT.email);
  }

  console.log(`\nDoctor login password: ${DOCTOR_PASSWORD}   |   Patient login: ${PATIENT.email} / ${PATIENT.password}`);
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e); process.exit(1); });
