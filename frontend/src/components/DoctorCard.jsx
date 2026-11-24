import { useContext } from "react";
import { AppContext } from "../context/AppContext.jsx";

const DoctorCard = ({ doctor }) => {
  const { navigate } = useContext(AppContext);
  return (
    <div className="bg-white flex flex-col md:flex-row items-center gap-6 p-4 w-[350px] md:w-[500px] mx-auto border border-gray-300 rounded-2xl">
      <img src={doctor.image} alt={doctor.name} className="w-32 h-32 rounded-full object-cover" />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-700">{doctor.name}</h2>
        <p>{doctor.specialty}</p>
        <p className="text-sm text-gray-600">
          {doctor.experience} experience · ₹{doctor.fees}
        </p>
        <p className={`text-sm ${doctor.available ? "text-green-600" : "text-red-500"}`}>
          {doctor.available ? "Available" : "Not available"}
        </p>
        <button
          onClick={() => {
            navigate("/doctor-details/" + doctor._id);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="border border-secondary text-primary hover:bg-secondary hover:text-white transition-all duration-200 py-2 px-4 rounded-full cursor-pointer mt-2"
        >
          See Details
        </button>
      </div>
    </div>
  );
};
export default DoctorCard;
