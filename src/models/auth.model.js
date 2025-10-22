import dotenv from "dotenv";
dotenv.config();

const salesEmails = process.env.SALES_EMAILS
  ? process.env.SALES_EMAILS.split(",").map(email => email.trim())
  : [];

const managerEmails = process.env.MANAGER_EMAILS
  ? process.env.MANAGER_EMAILS.split(",").map(email => email.trim())
  : [];

// Parse individual sales credentials
const salesCredentials = {};
if (process.env.SALES_CREDENTIALS) {
  process.env.SALES_CREDENTIALS.split(",").forEach(cred => {
    const [email, password] = cred.split(":").map(str => str.trim());
    if (email && password) {
      salesCredentials[email] = password;
    }
  });
}

const Auth = {
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  manager: {
    emails: managerEmails,
    password: process.env.MANAGER_PASSWORD,
  },
  sales: {
    emails: salesEmails,
    password: process.env.SALES_PASSWORD,
  },
  // Individual sales credentials
  salesCredentials: salesCredentials
};

export default Auth;