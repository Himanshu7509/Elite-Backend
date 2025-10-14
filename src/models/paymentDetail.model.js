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
}, { timestamps: true });

const PaymentDetail = mongoose.model("PaymentDetail", paymentDetailSchema);

export default PaymentDetail;
