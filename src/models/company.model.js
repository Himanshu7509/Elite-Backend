import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({}, { strict: false, timestamps: true });

const Company = mongoose.model("Company", CompanySchema);

export default Company;
