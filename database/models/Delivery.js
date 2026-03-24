import mongoose from 'mongoose';

const DeliverySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  dcNo: String,
  date: String,
  partyName: String,
  receivedChallanNo: String,
  items: Array,
  totalWeight: Number,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export default mongoose.model('Delivery', DeliverySchema);
