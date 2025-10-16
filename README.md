# Elite CRM Backend

## Recent Changes

### Mail Notice System
The notification system has been renamed to `mail-notice` to better reflect its integration with the mail system.

#### Updated Routes
- **Old**: `/notifications/*` 
- **New**: `/mail-notice/*`

#### Available Endpoints

1. **Send Multi-channel Notification**
   ```
   POST /mail-notice/send
   ```
   Body:
   ```json
   {
     "recipient": "user@example.com",
     "subject": "Notification Subject",
     "message": "Notification message content",
     "priority": "normal", // or "high"
     "channels": ["email", "inApp"], // available: email, inApp
     "fallback": true
   }
   ```

2. **Send Email Only**
   ```
   POST /mail-notice/email
   ```
   Body:
   ```json
   {
     "recipient": "user@example.com",
     "subject": "Email Subject",
     "message": "Email message content"
   }
   ```

3. **Send In-App Notification**
   ```
   POST /mail-notice/in-app
   ```
   Body:
   ```json
   {
     "userId": "user_id",
     "title": "Notification Title",
     "message": "Notification message content"
   }
   ```

4. **Get Notification Statistics**
   ```
   GET /mail-notice/stats
   ```

5. **Test All Notification Channels**
   ```
   POST /mail-notice/test
   ```
   Body:
   ```json
   {
     "recipient": "test@example.com"
   }
   ```

### Mail System
The existing mail system remains unchanged and is available at:
```
POST /mail/send-single
POST /mail/send-group
```

## Email Configuration

### Environment Variables
Create a `.env` file based on `.env.example` with your email configuration:

```env
# For Gmail (recommended for cloud deployments like Render/AWS)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password_here

# For custom SMTP servers
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASS=your_email_password
```

### Setting up Gmail for Production (IMPORTANT)
1. Enable 2-factor authentication on your Gmail account:
   - Go to https://myaccount.google.com/
   - Click "Security" in the left sidebar
   - Turn on "2-Step Verification"

2. Generate an App Password:
   - In the "Security" section, click "App passwords"
   - Select "Mail" as the app and your device
   - Copy the 16-character password (without spaces)
   - Use this as your `EMAIL_PASS` value

3. NEVER use your regular Gmail password - it won't work with SMTP

### Common Issues and Solutions

#### Connection Timeout (ETIMEDOUT)
- This often happens on cloud platforms like Render
- Make sure you're using an App Password, not your regular password
- Test locally first to verify your credentials work

#### Authentication Failed (EAUTH)
- Double-check your Gmail App Password
- Ensure 2-Factor Authentication is enabled
- Verify the EMAIL_USER matches your Gmail address exactly

#### Testing Your Configuration
Run the test script to verify your configuration:
```bash
node test-gmail-connection.js
```

### SMTP Configuration for Deployment
The system is configured to work with various hosting environments including:
- Local development
- Render
- AWS
- Other cloud platforms

The system includes multiple fallback mechanisms:
1. Primary SMTP configuration (Gmail recommended)
2. Relaxed connection settings
3. Alternative port configurations
4. Different TLS settings

## Error Handling
The system provides detailed error responses to help diagnose issues:
```json
{
  "success": false,
  "message": "Failed to send mail",
  "error": "Error description",
  "code": "Error code",
  "response": "Server response",
  "command": "Failed command",
  "debug": {
    "host": "SMTP host",
    "port": "SMTP port",
    "secure": "Secure setting",
    "user": "User (masked)"
  }
}
```

## Testing
To test the mail system:

1. Start the server:
   ```bash
   npm start
   ```

2. Send a test email:
   ```bash
   curl -X POST http://localhost:3000/mail/send-single \
     -H "Content-Type: application/json" \
     -d '{
       "to": "recipient@example.com",
       "subject": "Test Email",
       "message": "This is a test email"
     }'
   ```

3. Test the mail notice system:
   ```bash
   curl -X POST http://localhost:3000/mail-notice/email \
     -H "Content-Type: application/json" \
     -d '{
       "recipient": "recipient@example.com",
       "subject": "Test Notice",
       "message": "This is a test notice"
     }'
   ```

## Cloud Deployment Notes
When deploying to cloud platforms like Render or AWS:
1. Use Gmail with App Passwords for reliable email delivery
2. Custom SMTP servers may be blocked by cloud provider firewalls
3. Gmail has better deliverability from cloud platforms
4. Make sure to set up proper DNS records (SPF, DKIM) for your domain to avoid spam filtering