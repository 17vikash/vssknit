import mongoose from 'mongoose';

const PartySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  address: String,
  phone: String,
  gstNo: String,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export default mongoose.model('Party', PartySchema);
