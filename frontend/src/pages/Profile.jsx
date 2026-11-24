import { useContext } from "react";
import { Mail, User } from "lucide-react";
import { AppContext } from "../context/AppContext";

// Read-only for now: the backend has no "update profile" API yet (planned for a later phase).
const Profile = () => {
  const { user } = useContext(AppContext);
  return (
    <div className="min-h-screen bg-[#EBEBFE] py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
        <div className="space-y-5">
          <Row icon={<User className="w-5 h-5 text-primary" />} label="Name" value={user?.name} />
          <Row icon={<Mail className="w-5 h-5 text-primary" />} label="Email" value={user?.email} />
          <Row icon={<User className="w-5 h-5 text-primary" />} label="Account type" value={user?.role} />
        </div>
      </div>
    </div>
  );
};

const Row = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-gray-800">{value}</p>
    </div>
  </div>
);

export default Profile;
