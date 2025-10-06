import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:     { type: String, required: true },
  phoneNo:   { type: String, required: true },
  message:   { type: String },
  fatherName:{ type: String },
  contactNo: { type: String },
  experience:   { type: String },
  specialisation:{ type: String },
  productCompany: { type: String, required: true}
}, { timestamps: true });

const Form = mongoose.model("Form", formSchema);

export default Form;
