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
  // Track who created the payment detail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: false,
  },
  creatorRole: {
    type: String,
    required: true,
    enum: ["admin", "manager", "sales", "unknown"],
  },
  creatorEmail: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const PaymentDetail = mongoose.model("PaymentDetail", paymentDetailSchema);

export default PaymentDetail;