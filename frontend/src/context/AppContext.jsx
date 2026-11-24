import { createContext, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { specialtiesData } from "../assets/assets";
import { authService } from "../services/authService";
import { doctorService } from "../services/doctorService";

export const AppContext = createContext();

// The API returns `_id` from some routes and `id` from others; keep one shape in the app.
const normalizeUser = (u) =>
  u ? { id: u._id ?? u.id, name: u.name, email: u.email, role: u.role } : null;

// Map backend field names onto the names the existing UI components already use.
const normalizeDoctor = (d) => ({
  ...d,
  specialty: d.speciality,
  education: d.degree,
});

const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // false until the first /auth/profile call finishes
  const [healthSpecialties, setHealthSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const fetchHealthSpecialties = () => {
    setHealthSpecialties(specialtiesData);
  };

  const fetchDoctors = useCallback(async (speciality) => {
    setDoctorsLoading(true);
    try {
      const data = await doctorService.getAll(speciality);
      setDoctors(data.doctors.map(normalizeDoctor));
    } catch (error) {
      console.error("Could not load doctors:", error);
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  // Restore the session on every page load (the JWT lives in an httpOnly cookie,
  // so JS can't read it — we ask the backend who we are instead).
  useEffect(() => {
    (async () => {
      try {
        const data = await authService.getProfile();
        setUser(normalizeUser(data.user));
      } catch {
        setUser(null); // 401 just means "not logged in"
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  useEffect(() => {
    fetchHealthSpecialties();
    fetchDoctors();
  }, [fetchDoctors]);

  // These throw on failure so the calling page can show its own toast.
  const login = async ({ email, password, roll }) => {
    setLoading(true);
    try {
      const data =
        roll === "doctor"
          ? await doctorService.login({ email, password })
          : await authService.login({ email, password });
      setUser(normalizeUser(data.user));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, role }) => {
    setLoading(true);
    try {
      const data = await authService.register({ name, email, password, role });
      setUser(normalizeUser(data.user)); // backend also logs the new user in via cookie
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    setUser(null);
    navigate("/");
  };

  // derived, so it can never get out of sync with `user`
  const doctor = user?.role === "doctor";

  const value = {
    navigate,
    user,
    setUser,
    authChecked,
    doctor,
    loading,
    setLoading,
    healthSpecialties,
    doctors,
    doctorsLoading,
    fetchDoctors,
    login,
    register,
    logout,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
