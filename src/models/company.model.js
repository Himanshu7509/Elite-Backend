import mongoose from "mongoose";

// Add a pre-save hook to prevent saving empty documents
const CompanySchema = new mongoose.Schema({
  // We'll keep the flexible schema but add validation
}, { 
  strict: false, 
  timestamps: true 
});

// Pre-save middleware to prevent empty documents
CompanySchema.pre('save', function(next) {
  // Check if the document has meaningful data
  const doc = this.toObject();
  const keys = Object.keys(doc);
  const meaningfulKeys = keys.filter(key => 
    !['_id', '__v', 'createdAt', 'updatedAt'].includes(key) && 
    doc[key] !== null && 
    doc[key] !== undefined &&
    doc[key] !== ''
  );
  
  // If no meaningful data, don't save
  if (meaningfulKeys.length === 0) {
    next(new Error('Cannot save empty company document'));
  } else {
    next();
  }
});

const Company = mongoose.model("Company", CompanySchema);

export default Company;