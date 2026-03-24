import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNo: String,
  date: String,
  partyName: String,
  totalAmount: Number,
  items: Array,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export default mongoose.model('Invoice', InvoiceSchema);
