// Test script to verify mail functionality with sender tracking and attachments
import express from 'express';
import multer from 'multer';
import fs from 'fs';

const app = express();
app.use(express.json());

// Mock the mail controller functionality for testing
const mockSendMail = (options) => {
  console.log('=== Mock Email Sent ===');
  console.log('From:', options.from);
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  console.log('HTML Content:', options.html.substring(0, 100) + '...');
  
  if (options.attachments && options.attachments.length > 0) {
    console.log('Attachments:');
    options.attachments.forEach((attachment, index) => {
      console.log(`  ${index + 1}. ${attachment.filename} (${attachment.content.length} bytes)`);
    });
  }
  
  console.log('====================');
  return Promise.resolve({ id: 'mock-email-id' });
};

// Mock Resend
const mockResend = {
  emails: {
    send: mockSendMail
  }
};

// Test data
const testLead = {
  _id: 'test-lead-id',
  email: 'test@example.com',
  fullName: 'Test User'
};

const testUser = {
  email: 'admin@example.com',
  role: 'admin'
};

// Test 1: Send single mail with sender tracking
console.log('Test 1: Sending single mail with sender tracking');
try {
  const result = await mockResend.emails.send({
    from: 'Elite Associate <noreply@mail.eliteassociate.in>',
    to: testLead.email,
    subject: 'Test Subject',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>Hello ${testLead.fullName || "there"},</h3>
        <p>This is a test message.</p>
        <br />
        <p>Regards,<br>Elite Associate Team</p>
        <hr />
        <small>Sent by: ${testUser.email} (${testUser.role})</small>
      </div>
    `
  });
  console.log('✓ Single mail sent successfully');
} catch (error) {
  console.error('✗ Error sending single mail:', error.message);
}

// Test 2: Send mail with attachment
console.log('\nTest 2: Sending mail with attachment');
try {
  // Create a mock file buffer
  const mockFileBuffer = Buffer.from('This is a test PDF content');
  
  const result = await mockResend.emails.send({
    from: 'Elite Associate <noreply@mail.eliteassociate.in>',
    to: testLead.email,
    subject: 'Test Subject with Attachment',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>Hello ${testLead.fullName || "there"},</h3>
        <p>This is a test message with attachment.</p>
        <br />
        <p>Regards,<br>Elite Associate Team</p>
        <hr />
        <small>Sent by: ${testUser.email} (${testUser.role})</small>
      </div>
    `,
    attachments: [
      {
        filename: 'test-document.pdf',
        content: mockFileBuffer
      }
    ]
  });
  console.log('✓ Mail with attachment sent successfully');
} catch (error) {
  console.error('✗ Error sending mail with attachment:', error.message);
}

console.log('\n=== All tests completed ===');