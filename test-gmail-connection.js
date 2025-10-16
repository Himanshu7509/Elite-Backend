import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing Gmail configuration...');
console.log('Host:', process.env.EMAIL_HOST);
console.log('Port:', process.env.EMAIL_PORT);
console.log('Secure:', process.env.EMAIL_SECURE);
console.log('User:', process.env.EMAIL_USER);
console.log('Has Password:', !!process.env.EMAIL_PASS);

// Validate required environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('ERROR: EMAIL_USER and EMAIL_PASS environment variables are required');
  process.exit(1);
}

if (process.env.EMAIL_PASS === 'your_gmail_app_password_here') {
  console.error('ERROR: You must replace "your_gmail_app_password_here" with your actual Gmail App Password');
  console.error('Steps to generate an App Password:');
  console.error('1. Go to https://myaccount.google.com/');
  console.error('2. Navigate to Security > 2-Step Verification > App passwords');
  console.error('3. Generate a new app password for "Mail"');
  console.error('4. Use that 16-character password (without spaces) as your EMAIL_PASS');
  process.exit(1);
}

// Create transporter with Gmail configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
});

console.log('Attempting to verify Gmail connection...');

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Gmail connection failed:', error);
    console.log('Error code:', error.code);
    console.log('Error command:', error.command);
    
    if (error.code === 'EAUTH') {
      console.log('\nAUTHENTICATION ERROR:');
      console.log('- Check that your EMAIL_USER is correct');
      console.log('- Ensure you are using an App Password, not your regular Gmail password');
      console.log('- Verify 2-Factor Authentication is enabled on your Google account');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\nTIMEOUT ERROR:');
      console.log('- This may be due to network restrictions on Render');
      console.log('- Try testing from your local machine first');
      console.log('- Check if your ISP blocks outgoing SMTP connections');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\nCONNECTION REFUSED ERROR:');
      console.log('- Check that smtp.gmail.com is accessible from your network');
      console.log('- Port 587 should be open');
    }
  } else {
    console.log('SUCCESS: Gmail server is ready to take our messages');
    
    // Send a test email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email from Elite CRM (Gmail Connection Test)',
      text: 'This is a test email to verify the Gmail SMTP configuration.',
      html: '<p>This is a <b>test email</b> to verify the Gmail SMTP configuration.</p>'
    };

    console.log('Attempting to send test email...');
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log('Error sending email:', err);
        console.log('Error code:', err.code);
        console.log('Error command:', err.command);
      } else {
        console.log('SUCCESS: Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
      }
      process.exit(0);
    });
  }
});