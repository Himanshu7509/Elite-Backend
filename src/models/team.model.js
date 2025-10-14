import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "sales" }, // can be "admin", "manager", "sales"
  password: { type: String, required: true }, // for static or hashed passwords
  assignedLeads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Form" }],
}, { timestamps: true });

const Team = mongoose.model("Team", teamSchema);

export default Team;
