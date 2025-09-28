import mongoose from "mongoose";

const admissionFormSchema = new mongoose.Schema(
  {
    fullName:      { type: String, required: true },
    fatherName:    { type: String, required: true },
    qualification: { type: String, required: true },
    dob:           { type: Date, required: true },
    phoneNo:       { type: String, required: true },
    contactNo:     { type: String },
    email:         { type: String, required: true },
    course: {
      courseName: { type: String, required: true },
      courseCode: { type: String,}
    },
    productCompany: { type: String, default: "JIFSA" }
  },
  { timestamps: true }
);

const AdmissionForm = mongoose.model("AdmissionForm", admissionFormSchema);

export default AdmissionForm;
