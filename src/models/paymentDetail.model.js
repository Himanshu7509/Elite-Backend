import mongoose from "mongoose";

const paymentDetailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  details: {
    type: String,
    required: false,
  },
  uploadImg: {
    type: String, 
    required: true,
  },
  // Flexible billing fields - all optional
  startDate: {
    type: Date,
    required: false,
  },
  endDate: {
    type: Date,
    required: false,
  },
  amount: {
    type: Number,
    required: false,
    min: 0,
  },
  currency: {
    type: String,
    default: "INR",
    enum: ["INR", "USD", "EUR"],
  },
  billingType: {
    type: String,
    default: "one-time",
    enum: ["one-time", "monthly", "yearly", "quarterly"],
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