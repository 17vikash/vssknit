import mongoose from 'mongoose';

const DyeingUnitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  address: String,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export default mongoose.model('DyeingUnit', DyeingUnitSchema);
