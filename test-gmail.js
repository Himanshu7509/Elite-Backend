import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing Gmail configuration...');
console.log('Host:', process.env.EMAIL_HOST);
console.log('Port:', process.env.EMAIL_PORT);
console.log('Secure:', process.env.EMAIL_SECURE);
console.log('User:', process.env.EMAIL_USER);
console.log('Gmail User:', process.env.GMAIL_USER);
console.log('Has App Password:', !!process.env.GMAIL_APP_PASSWORD);

// Create transporter with Gmail configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.GMAIL_USER || process.env.EMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Gmail connection failed:', error);
  } else {
    console.log('Gmail server is ready to take our messages');
    
    // Send a test email
    const mailOptions = {
      from: process.env.GMAIL_USER || process.env.EMAIL_USER,
      to: process.env.GMAIL_USER || process.env.EMAIL_USER,
      subject: 'Test Email from Elite CRM (Gmail)',
      text: 'This is a test email to verify the Gmail SMTP configuration.',
      html: '<p>This is a <b>test email</b> to verify the Gmail SMTP configuration.</p>'
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log('Error sending email:', err);
      } else {
        console.log('Email sent successfully:', info.response);
      }
      process.exit(0);
    });
  }
});