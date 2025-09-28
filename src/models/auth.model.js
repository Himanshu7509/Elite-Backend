import dotenv from "dotenv";

dotenv.config();

const Auth = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD
};

export default Auth;