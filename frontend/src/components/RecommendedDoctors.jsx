import { useContext } from "react";
import { Stethoscope } from "lucide-react";
import { AppContext } from "../context/AppContext.jsx";
import { findDoctors } from "../utils/recommendations.js";

// "Recommended Doctor Specialty" section. `recommendations` comes from buildRecommendations().
const RecommendedDoctors = ({ recommendations }) => {
  const { navigate, doctors } = useContext(AppContext);

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold text-center mb-1">
        Recommended <span className="text-secondary">Doctor Specialty</span>
      </h2>
      <p className="text-center text-sm text-gray-500 mb-6">Based on your symptoms and screening results</p>

      <div className="space-y-6">
        {recommendations.map((rec) => {
          const matches = findDoctors(doctors, rec.specialty);
          return (
            <div key={rec.specialty} className="bg-white border border-gray-300 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Stethoscope className="w-6 h-6 text-primary" /></div>
                <h3 className="text-xl font-semibold text-gray-800">{rec.specialty}</h3>
              </div>
              <ul className="list-disc ml-12 mt-2 text-sm text-gray-600 space-y-1">
                {rec.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>

              {matches.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  {matches.map((doctor) => (
                    <div key={doctor._id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl">
                      <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-700">{doctor.name}</p>
                        <p className="text-sm text-gray-500">{doctor.specialty} · {doctor.experience}</p>
                        <p className="text-sm text-gray-500">Fee: ₹{doctor.fees}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigate("/doctor-details/" + doctor._id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="border border-secondary text-primary hover:bg-secondary hover:text-white transition-all py-2 px-4 rounded-full cursor-pointer text-sm"
                      >
                        Book Appointment
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // No doctor of this type in the database yet: don't leave a dead end
                <div className="mt-5 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                  No {rec.specialty} is listed yet.{" "}
                  <button onClick={() => navigate("/doctors")} className="text-secondary underline cursor-pointer">
                    Browse all doctors
                  </button>{" "}
                  and book a General Physician for a first consultation.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedDoctors;
