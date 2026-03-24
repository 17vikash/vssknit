import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  role: String,
  joinDate: String,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export default mongoose.model('Staff', StaffSchema);
