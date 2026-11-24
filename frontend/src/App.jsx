import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import DiagnosticsHub from "./pages/DiagnosticsHub";
import DoctorDetails from "./pages/DoctorDetails";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HealthAssessment from './pages/HealthAssessment';
import MyAppointments from "./pages/MyAppointments";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Layout from "./pages/doctor/Layout";
import Dashboard from "./pages/doctor/Dashboard";
import Appointments from "./pages/doctor/Appointments";
import MyProfile from "./pages/doctor/MyProfile";
import { Toaster } from "react-hot-toast";
import { useContext } from "react";
import { AppContext } from "./context/AppContext";
const App = () => {
  const { doctor, authChecked } = useContext(AppContext);
  const doctorPath = useLocation().pathname.includes("doctor-dashboard");
  return (
    <div>
      <Toaster />
      {!doctorPath && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/symptom-checker" element={<DiagnosticsHub />} />
        {/* old links keep working: they now open the matching tab of the hub */}
        <Route path="/symptom-checker/heart" element={<Navigate to="/symptom-checker?tab=cardiovascular" replace />} />
        <Route path="/symptom-checker/diabetes" element={<Navigate to="/symptom-checker?tab=metabolic" replace />} />
        <Route path="/doctor-details/:id" element={<DoctorDetails />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/my-appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
        <Route path="/assessment" element={<HealthAssessment />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Doctor Routes */}
        <Route
          path="/doctor-dashboard"
          element={
            !authChecked ? (
              <div className="py-32 text-center text-gray-600">Loading...</div>
            ) : doctor ? (
              <Layout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="my-profile" element={<MyProfile />} />
        </Route>
      </Routes>
      {!doctorPath && <Footer />}
    </div>
  );
};
export default App;
