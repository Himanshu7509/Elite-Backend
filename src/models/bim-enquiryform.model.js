import mongoose from "mongoose";

const bimEnquiryScehma = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:     { type: String, required: true },
  phoneNo:   { type: String, required: true },
  experience:   { type: String },
  specialisation:{ type: String },
  productCompany: { type: String, default: "JIFSA" }
}, { timestamps: true });

const BimEnquiryForm = mongoose.model("BimEnquiryForm", bimEnquiryScehma);

export default BimEnquiryForm;
