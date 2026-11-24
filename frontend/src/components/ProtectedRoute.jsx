import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

// Wrap any page that needs a logged-in user.
// While the first /auth/profile check is running we show a loader (not the login page),
// otherwise a refresh would kick logged-in users out for a split second.
const ProtectedRoute = ({ children }) => {
  const { user, authChecked } = useContext(AppContext);
  if (!authChecked) return <div className="py-32 text-center text-gray-600">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
