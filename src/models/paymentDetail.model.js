import mongoose from "mongoose";

const paymentDetailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  details: {
    type: String,
    required: true,
  },
  uploadImg: {
    type: String, 
    required: true,
  },
  // New fields for monthly billing
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "INR",
    enum: ["INR", "USD", "EUR"],
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "paid", "overdue", "cancelled"],
  },
  reminderDate: {
    type: Date,
    required: false,
  },
  // Track who created the payment detail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: false,
  },
  creatorRole: {
    type: String,
    required: true,
    enum: ["admin", "manager", "sales", "counsellor", "hr", "telecaller", "marketing", "developer", "analyst", "unknown"],
  },
  creatorEmail: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const PaymentDetail = mongoose.model("PaymentDetail", paymentDetailSchema);

export default PaymentDetail;