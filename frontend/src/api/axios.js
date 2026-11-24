import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});


export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request) return "Cannot reach the server. Is the backend running?";
  return fallback;
};

export default api;