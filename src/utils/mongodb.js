import mongoose from "mongoose";

let isConnected = false;

const dbConnect = async () => {
  // In serverless environments, we need to check if we're already connected
  // and avoid creating new connections unnecessarily
  if (isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  // Also check Mongoose connection state
  if (mongoose.connection.readyState === 1) {
    console.log("⚡ Mongoose already connected");
    isConnected = true;
    return;
  }

  try {
    console.log("Attempting MongoDB connection...");
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Additional options for better serverless support
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable buffering
      bufferCommands: false, // Disable command buffering
    });
    
    isConnected = conn.connections[0].readyState;
    console.log("✅ MongoDB connected successfully");
    console.log("Connection state:", isConnected);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("Error stack:", err.stack);
    isConnected = false;
    throw err;
  }
};

// Add a disconnect function for better connection management
const dbDisconnect = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("🔌 MongoDB disconnected");
  }
};

export { dbConnect, dbDisconnect };
export default dbConnect;