import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Team",
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userRole: { 
    type: String 
  },
  reportField: { 
    type: String, 
    required: true 
  },
  linkField: { 
    type: String 
  },
  uploadFiles: [{ 
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  attendance: {
    date: { 
      type: Date 
    },
    morningTime: { 
      type: String 
    },
    eveningTime: { 
      type: String 
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

const Report = mongoose.model("Report", reportSchema);

export default Report;