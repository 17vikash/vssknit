import mongoose from 'mongoose';

const ReceivedSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  partyName: String,
  receivedDate: String,
  clothType: String,
  pieces: Number,
  weight: Number,
  lotNo: String,
  status: { type: String, default: 'Pending' },
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export default mongoose.model('Received', ReceivedSchema);
