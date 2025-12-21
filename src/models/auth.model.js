import dotenv from "dotenv";
dotenv.config();

const Auth = {
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  }
  // Manager accounts are now created dynamically through the team management system
  // No hardcoded manager emails or passwords
};

export default Auth;