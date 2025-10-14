import dotenv from "dotenv";
dotenv.config();

const salesEmails = process.env.SALES_EMAILS
  ? process.env.SALES_EMAILS.split(",").map(email => email.trim())
  : [];

const Auth = {
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  sales: {
    emails: salesEmails,
    password: process.env.SALES_PASSWORD,
  }
};

export default Auth;
