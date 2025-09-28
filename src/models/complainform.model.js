import mongoose from "mongoose";

const formComplainSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:     { type: String, required: true },
  phoneNo:   { type: String, required: true },
  message:   { type: String, required: true },
  studentId:{ type: String, required: true},
  productCompany: { type: String, default: "JIFSA" }
},{
    timestamps: true
});

const ComplainForm = mongoose.model("ComplainForm", formComplainSchema);

export default ComplainForm;
