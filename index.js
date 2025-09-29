import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnect from "./src/utils/mongodb.js";
import AuthRouter from "./src/routes/auth.route.js";
import formRouter from "./src/routes/form.route.js";
import admissionRouter from "./src/routes/admissionform.route.js";
import complainFormRouter from "./src/routes/complainform.route.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", AuthRouter);
app.use('/form',formRouter);
app.use('/admission-form',admissionRouter);
app.use('/complaint',complainFormRouter);

dbConnect();

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export default app;