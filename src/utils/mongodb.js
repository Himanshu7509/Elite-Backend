import mongoose from "mongoose";

let isConnected = false;

const dbConnect = async () => {
  if (isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  try {
    console.log("Attempting MongoDB connection...");
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
    console.log("MONGO_URI length:", process.env.MONGO_URI?.length || 0);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    isConnected = conn.connections[0].readyState;
    console.log("✅ MongoDB connected successfully");
    console.log("Connection state:", isConnected);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("Error stack:", err.stack);
  }
};

export default dbConnect;