import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Calendar, Clock, GraduationCap, IndianRupee, Mail } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { doctorService } from "../services/doctorService";
import { appointmentService } from "../services/appointmentService";
import { getErrorMessage } from "../api/axios";

const ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const label = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
// local (not UTC) YYYY-MM-DD, so "today" is correct in India too
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const DoctorDetails = () => {
  const { id } = useParams();
  const { navigate, user } = useContext(AppContext);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [booked, setBooked] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await doctorService.getById(id);
        setDoctor({ ...data.doctor, specialty: data.doctor.speciality, education: data.doctor.degree });
      } catch {
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // whenever the date changes, ask the server which slots are already taken
  useEffect(() => {
    setSlotTime("");
    if (!slotDate) return setBooked([]);
    appointmentService
      .booked(id, slotDate)
      .then((d) => setBooked(d.booked))
      .catch(() => setBooked([]));
  }, [id, slotDate]);

  const handleBook = async () => {
    if (!user) {
      toast.error("Please login to book an appointment.");
      return navigate("/login");
    }
    if (!slotDate || !slotTime) return toast.error("Please select a date and a time slot.");

    setSubmitting(true);
    try {
      const data = await appointmentService.book({ docId: id, slotDate, slotTime });
      toast.success(data.message || "Appointment booked!");
      navigate("/my-appointments");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not book appointment"));
      // slot may have just been taken — refresh the list
      appointmentService.booked(id, slotDate).then((d) => setBooked(d.booked)).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-32 text-center text-gray-600">Loading doctor...</div>;
  if (!doctor)
    return (
      <div className="py-32 text-center">
        <p className="text-gray-700 mb-4">Doctor not found.</p>
        <button onClick={() => navigate("/doctors")} className="bg-primary text-white py-2 px-6 rounded-lg cursor-pointer">
          Back to doctors
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white p-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Doctor Details</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Doctor info */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <img src={doctor.image} alt={doctor.name} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-primary/20" />
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{doctor.name}</h2>
                <p className="text-lg text-primary font-semibold mb-3">{doctor.specialty}</p>
                <p className={`text-sm font-medium ${doctor.available ? "text-green-600" : "text-red-500"}`}>
                  {doctor.available ? "Available for appointments" : "Currently not available"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 p-6 space-y-4">
              <Info icon={<GraduationCap className="w-5 h-5 text-primary" />} title="Education" text={doctor.education} />
              <Info icon={<Clock className="w-5 h-5 text-primary" />} title="Experience" text={doctor.experience} />
              <Info icon={<IndianRupee className="w-5 h-5 text-primary" />} title="Consultation Fee" text={`₹ ${doctor.fees}`} />
              <Info icon={<Mail className="w-5 h-5 text-primary" />} title="Email" text={doctor.email} />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">About</h3>
                <p className="text-gray-600">{doctor.about}</p>
              </div>
            </div>
          </div>

          {/* Booking */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Book Appointment</h2>
              <p className="text-gray-600">Schedule your consultation with {doctor.name}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="slotDate" className="block text-sm font-medium text-gray-700 mb-2">Appointment Date</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    id="slotDate"
                    value={slotDate}
                    min={localToday()}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">Select a time slot</p>
                {!slotDate ? (
                  <p className="text-sm text-gray-500">Choose a date to see available slots.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ALL_SLOTS.map((t) => {
                      const taken = booked.includes(t);
                      const active = slotTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={taken}
                          onClick={() => setSlotTime(t)}
                          className={`py-2 rounded-lg border text-sm transition-colors ${
                            taken
                              ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed"
                              : active
                              ? "bg-primary text-white border-primary"
                              : "border-gray-300 hover:border-primary cursor-pointer"
                          }`}
                        >
                          {label(t)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex justify-between items-center">
                <span className="text-gray-700 font-medium">Consultation Fee:</span>
                <span className="text-2xl font-bold text-primary">₹ {doctor.fees}</span>
              </div>

              <button
                onClick={handleBook}
                disabled={submitting || !doctor.available}
                className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Booking..." : "Book Appointment"}
              </button>
              <p className="text-sm text-gray-500 text-center">Pay at the clinic for now — online payment is coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ icon, title, text }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
    <div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-600 break-all">{text}</p>
    </div>
  </div>
);

export default DoctorDetails;
