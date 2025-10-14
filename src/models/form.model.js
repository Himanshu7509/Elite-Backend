import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    // Basic applicant details
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNo: { type: String, required: true },
    alternatePhoneNo: { type: String }, // ✅ New field
    age: { type: Number }, // ✅ New field
    dob: { type: Date }, // ✅ New field (Date of Birth)
    address: { type: String }, // ✅ New field

    // Additional info
    message: { type: String },
    fatherName: { type: String },
    contactNo: { type: String },

    // Education & experience details
    experience: { type: String },
    specialisation: { type: String },
    highestDegree: { type: String }, // ✅ New field
    collegeOrInstituteName: { type: String }, // ✅ New field
    schoolName: { type: String }, // ✅ New field

    // Company/Product information
    productCompany: { type: String, required: true },

    // CRM system fields
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    status: {
      type: String,
      enum: ["unread", "read", "interested", "not_interested"],
      default: "unread",
    },

    // Date fields
    date: { type: Date, default: Date.now }, // ✅ New field (Form submission date)
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", formSchema);

export default Form;
