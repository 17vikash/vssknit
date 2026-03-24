import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  companyName: String,
  address: String,
  phone: String,
  email: String,
  gstNo: String,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export default mongoose.model('Setting', SettingSchema);
