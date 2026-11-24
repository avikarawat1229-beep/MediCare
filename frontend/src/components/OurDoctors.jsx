import { useContext } from "react";
import { AppContext } from "../context/AppContext.jsx";
import DoctorCard from "./DoctorCard.jsx";

const OurDoctors = () => {
  const { doctors } = useContext(AppContext);
  return (
    <div className="py-16 bg-[#EBEBFE] ">
      <h1 className="text-3xl md:text-5xl font-semibold text-gray-700 text-center capitalize">
        Our <span className="text-secondary">Specialist</span> Doctors
      </h1>
      <p className="text-center text-gray-600 mt-4 max-w-2xl mx-auto px-4">
        Our team of highly qualified specialists is dedicated to providing
        expert care tailored to your unique health needs.
      </p>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-5 mt-10">
        {doctors.slice(0, 6).map((doctor) => (
          <DoctorCard key={doctor._id} doctor={doctor} />
        ))}
      </div>
    </div>
  );
};
export default OurDoctors;
