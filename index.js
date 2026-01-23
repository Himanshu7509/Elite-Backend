import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./src/utils/mongodb.js";
import AuthRouter from "./src/routes/auth.route.js";
import formRouter from "./src/routes/form.route.js";
import admissionRouter from "./src/routes/admissionform.route.js";
import complainFormRouter from "./src/routes/complainform.route.js";
import PayamentDetailRouter from "./src/routes/paymentDetail.route.js";
import TeamRouter from "./src/routes/team.route.js";
import mailRouter from "./src/routes/lead-mail.route.js";
import B2BRouter from "./src/routes/b2b.route.js";
import ImageRouter from "./src/routes/image.route.js";
import SocialMediaRouter from "./src/routes/socialMedia.route.js";
import EnrollmentRouter from "./src/routes/enrollment.route.js"; // Add this import
import CompanyRouter from "./src/routes/company.route.js"; // Add this import
import ReportRouter from './src/routes/report.route.js'; // Add report router
import InternAppliedDataRouter from './src/routes/internAppliedData.route.js'; // Add intern applied data router
import NotificationRouter from './src/routes/notification.route.js'; // Add notification router
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',            
      'http://localhost:3000',          
      'http://127.0.0.1:5173',          
      'http://127.0.0.1:3000',        
      'https://elitebmi.in',            
      'https://www.elitebmi.in',
      'https://eliteassociate.in',
      'https://www.eliteassociate.in/',
      'https://www.elitebifs.in',
      'https://www.elitebim.in',
      'https://www.jifsacareers.com',
      'https://www.eeetechnologies.in',
      'https://www.eliteindiajobs.in'
    ];
    
    // Check if origin is in allowed list or is a local network address
    const isLocalNetwork = origin && (
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://172.') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    );
    
    callback(null, isLocalNetwork || allowedOrigins.indexOf(origin) !== -1);
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static assets
app.use("/assets", express.static(path.join(__dirname, "src", "assets")));

app.use("/auth", AuthRouter);
app.use('/form',formRouter);
app.use('/admission-form',admissionRouter);
app.use('/complaint',complainFormRouter);
app.use('/payment-detail', PayamentDetailRouter);
app.use('/team', TeamRouter)
app.use('/mail', mailRouter)
app.use('/b2b', B2BRouter)
app.use('/image', ImageRouter)
app.use('/social-media', SocialMediaRouter)
app.use('/enrollment', EnrollmentRouter) // Add this route
app.use('/companies', CompanyRouter) // Add this route
app.use('/reports', ReportRouter); // Add report route
app.use('/intern-applied-data', InternAppliedDataRouter); // Add intern applied data route
app.use('/notifications', NotificationRouter); // Add notification route

dbConnect();

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://${process.env.HOST || 'localhost'}:${PORT}`));

export default app;