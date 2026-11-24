import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { 
    type: String, 
    required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true },
  speciality: { 
    type: String, 
    required: true },
  degree: { 
    type: String, 
    required: true 
  },
  fees: { type: Number, required: true },
  experience: { 
    type: String, 
    required: true 
  },
  about: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String, 
    required: true 
  },
  available: {
   type: Boolean, 
   default: true 
  },
  slots_booked: {
    type: Object, //An object lets you map Dates as keys and Arrays of booked times as values
    default: {}
  }
} , { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;