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
EMAIL_HOST=mail.eliteassociate.in
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@eliteassociate.in
EMAIL_PASS=your_email_password
```

### SMTP Configuration for Deployment
The system is configured to work with various hosting environments including:
- Local development
- Render
- AWS
- Other cloud platforms

The system includes multiple fallback mechanisms:
1. Primary SMTP configuration (port 587)
2. Fallback to SSL/TLS (port 465)
3. Alternative TLS settings
4. Connection timeout handling

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