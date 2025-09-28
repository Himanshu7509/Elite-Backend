import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String },
  email:     { type: String, required: true },
  phoneNo:   { type: String, required: true },
  message:   { type: String },
  fatherName:{ type: String },
  contactNo: { type: String },
  productCompany: { type: String, default: "JIFSA" }
}, { timestamps: true });

const Form = mongoose.model("Form", formSchema);

export default Form;
