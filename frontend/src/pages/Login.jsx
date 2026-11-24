import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Lock, MailIcon, User2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getErrorMessage } from "../api/axios";

const Login = () => {
  const { navigate, login, loading } = useContext(AppContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    roll: "patient",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(formData); // patient -> /auth/login, doctor -> /doctors/login
      toast.success(data.message || "Login Successful");
      navigate(data.user?.role === "doctor" ? "/doctor-dashboard" : "/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    }
  };

  return (
    <div className="bg-[#EBEBFE] min-h-screen py-32 mt-3">
      <form
        onSubmit={handleSubmit}
        className="max-w-96 w-full mx-auto  text-center border border-gray-300/60 rounded-2xl px-8 bg-primary"
      >
        <h1 className="text-white text-3xl mt-10 font-medium">Login</h1>
        <p className="text-white text-sm mt-2">Please sign in to continue</p>
        <div className="flex items-center w-full mt-10 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <MailIcon />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="bg-transparent text-gray-800 placeholder-gray-800 outline-none text-sm w-full h-full"
            placeholder="Email"
            required
          />
        </div>
        <div className="flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <User2Icon />
          <select
            name="roll"
            value={formData.roll}
            onChange={handleChange}
            className="bg-transparent text-gray-800 placeholder-gray-800 outline-none text-sm w-full h-full"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>

        <div className="flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <Lock />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="bg-transparent text-gray-800 placeholder-gray-800 outline-none text-sm w-full h-full"
            placeholder="Password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full h-11 rounded-full text-white bg-secondary  cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "please wait..." : "Login"}
        </button>
        <p className="py-4 text-white">
          Don't have an account?
          <Link to="/signup">
            <span className="text-secondary">Signup</span>
          </Link>
        </p>
      </form>
    </div>
  );
};
export default Login;
