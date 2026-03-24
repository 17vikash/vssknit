import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g., "2024-03-24"
  date: String,
  records: Array,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export default mongoose.model('Attendance', AttendanceSchema);
