import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Calendar, Clock } from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import { getErrorMessage } from "../api/axios";

const STATUS_STYLE = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-green-100 text-green-800",
  Completed: "bg-blue-100 text-blue-800",
  Cancelled: "bg-red-100 text-red-800",
};

const formatDate = (s) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const formatTime = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await appointmentService.list();
      setAppointments(data.appointments);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load appointments"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      const data = await appointmentService.cancel(id);
      toast.success(data.message);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not cancel appointment"));
    }
  };

  return (
    <div className="min-h-screen bg-[#EBEBFE] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Appointments</h1>

        {loading ? (
          <p className="text-gray-600">Loading your appointments...</p>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-600">
            You have no appointments yet. Book one from the Doctors page.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((a) => (
              <div key={a._id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row gap-5 md:items-center">
                <img src={a.docData?.image} alt={a.docData?.name} className="w-24 h-24 rounded-full object-cover" />
                <div className="flex-1 space-y-1">
                  <h2 className="text-lg font-semibold text-gray-800">{a.docData?.name}</h2>
                  <p className="text-primary">{a.docData?.speciality}</p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" /> {formatDate(a.slotDate)}
                    <Clock className="w-4 h-4 ml-2" /> {formatTime(a.slotTime)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Fee: ₹{a.amount} · {a.payment ? "Paid" : "Pay at clinic"}
                  </p>
                </div>
                <div className="flex md:flex-col items-center md:items-end gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                  {(a.status === "Pending" || a.status === "Confirmed") && (
                    <button
                      onClick={() => handleCancel(a._id)}
                      className="border border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition py-1.5 px-4 rounded-full text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default MyAppointments;
