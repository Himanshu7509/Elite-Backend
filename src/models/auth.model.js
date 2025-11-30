import dotenv from "dotenv";
dotenv.config();

const managerEmails = process.env.MANAGER_EMAILS
  ? process.env.MANAGER_EMAILS.split(",").map(email => email.trim())
  : [];

const Auth = {
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  manager: {
    emails: managerEmails,
    password: process.env.MANAGER_PASSWORD,
  }
};

export default Auth;