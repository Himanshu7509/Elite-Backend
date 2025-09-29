import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./src/utils/mongodb.js";
import AuthRouter from "./src/routes/auth.route.js";
import formRouter from "./src/routes/form.route.js";
import admissionRouter from "./src/routes/admissionform.route.js";
import complainFormRouter from "./src/routes/complainform.route.js";

dotenv.config();
console.log("=== SERVER STARTUP DEBUG ===");
console.log("Environment variables loaded:");
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("PORT:", process.env.PORT || 3000);
console.log("=== END SERVER STARTUP DEBUG ===");

const app = express();

// Connect to MongoDB when the server starts
dbConnect().catch(err => {
  console.error("Failed to connect to MongoDB on startup:", err.message);
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://jifsa-crm.vercel.app",
      "https://www.jifsacareers.com",
      "https://www.jifsacareers.in",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use("/auth", AuthRouter);
app.use('/form',formRouter);
app.use('/admission-form',admissionRouter);
app.use('/complaint',complainFormRouter);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export default app;