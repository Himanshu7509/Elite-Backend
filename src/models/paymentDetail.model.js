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
    type: String, // This will store the S3 file URL
    required: true,
  },
}, { timestamps: true });

const PaymentDetail = mongoose.model("PaymentDetail", paymentDetailSchema);

export default PaymentDetail;
