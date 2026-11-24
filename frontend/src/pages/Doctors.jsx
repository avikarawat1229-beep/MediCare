import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext.jsx";
import DoctorCard from "../components/DoctorCard.jsx";

const Doctors = () => {
  const { doctors, doctorsLoading } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");

  const term = searchTerm.toLowerCase();
  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(term) ||
      doctor.specialty.toLowerCase().includes(term)
  );

  return (
    <div className="py-16 bg-[#EBEBFE]">
      <h1 className="text-4xl font-bold text-center mb-8">
        Our <span className="text-secondary">Doctors</span>
      </h1>
      <p className="text-center">Here is a list of our doctors</p>

      <div className="flex justify-center mt-6">
        <input
          type="text"
          placeholder="search by name or speciality..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[90%] md:w-[400px] px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>

      {doctorsLoading ? (
        <p className="text-center mt-10 text-gray-600">Loading doctors...</p>
      ) : filteredDoctors.length === 0 ? (
        <p className="text-center mt-10 text-gray-600">
          No doctors found. (If the list is empty, run <code>npm run seed</code> in the backend.)
        </p>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-5 mt-10">
          {filteredDoctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
};
export default Doctors;
