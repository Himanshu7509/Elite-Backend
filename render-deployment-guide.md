# 🚀 Render Deployment Guide - Webmail SMTP Fix

## 🔧 **SMTP Connection Timeout Solution**

The `ETIMEDOUT` error occurs because cloud platforms like Render have different network configurations than localhost. This guide provides a **webmail-first approach** as requested, with enhanced cloud compatibility.

## ⚙️ **Updated SMTP Configuration**

The system now uses **3-tier SMTP fallback** prioritizing your webmail:

1. **🥇 Webmail STARTTLS** - `radiant.herosite.pro:587` (Cloud-optimized)
2. **🥈 Webmail SSL** - `radiant.herosite.pro:465` (Original config)
3. **🥉 Gmail Fallback** - `smtp.gmail.com:587` (Emergency backup)

## 📋 **Render Environment Variables**

### **Required Variables (Webmail Priority):**
```env
# Primary Webmail SMTP Configuration
EMAIL_USER=info@eliteassociate.in
EMAIL_PASS=zM[9Owl+ltUx.zw2
EMAIL_HOST=radiant.herosite.pro
EMAIL_PORT=465
EMAIL_SECURE=true

# Cloud-Optimized Timeout Settings
EMAIL_CONN_TIMEOUT=60000
EMAIL_GREET_TIMEOUT=30000
EMAIL_SOCKET_TIMEOUT=60000

# Optional Gmail Fallback (Emergency Only)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

## 🔧 **Webmail Cloud Optimizations**

### **Enhanced TLS Configuration:**
- `rejectUnauthorized: false` - For webmail server compatibility
- `ciphers: 'SSLv3'` - Additional cipher support
- **Port 587 with STARTTLS** - Primary method for cloud platforms
- **Port 465 with SSL** - Fallback to original configuration

### **Extended Timeouts:**
- **Connection**: 60 seconds (vs default 10s)
- **Greeting**: 30 seconds (vs default 10s)  
- **Socket**: 60 seconds (vs default 10s)

## 🚀 **Deployment Steps**

### **1. Set Environment Variables in Render:**
- Go to your Render dashboard
- Navigate to your service → Environment
- Add all webmail variables from above
- **Deploy** your service

### **2. Test Webmail SMTP Endpoints:**

```bash
# Test Webmail SMTP (Primary)
curl -X POST https://your-app.onrender.com/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "test@gmail.com",
    "subject": "Webmail SMTP Test",
    "message": "Testing webmail SMTP from Render deployment"
  }'

# Test Multi-channel with Webmail
curl -X POST https://your-app.onrender.com/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "test@gmail.com",
    "subject": "Webmail Multi-channel Test",
    "message": "Testing webmail notification system",
    "channels": ["email"]
  }'
```

## 🔍 **Troubleshooting Webmail SMTP**

### **If Webmail STARTTLS (Port 587) Fails:**
- ✅ Check if `radiant.herosite.pro` supports STARTTLS on port 587
- ✅ Verify firewall allows outbound connections to port 587
- ✅ System will automatically fallback to SSL on port 465

### **If Webmail SSL (Port 465) Fails:**
- ✅ Verify credentials: `info@eliteassociate.in` / `zM[9Owl+ltUx.zw2`
- ✅ Check if `radiant.herosite.pro` is accessible from Render
- ✅ System will fallback to Gmail if configured

### **If All Webmail Methods Fail:**
- ✅ Contact `radiant.herosite.pro` support about cloud platform access
- ✅ Check Render logs for specific connection errors
- ✅ Consider temporary Gmail fallback while resolving webmail issues

## 📊 **Expected Success Flow (Webmail Priority)**

```
✅ Attempting SMTP connection with webmail_starttls on port 587
✅ Webmail STARTTLS connection successful
✅ Email sent successfully via webmail_starttls
```

**Or if STARTTLS fails:**
```
❌ webmail_starttls failed: Connection timeout
✅ Attempting SMTP connection with webmail_ssl on port 465
✅ Email sent successfully via webmail_ssl
```

## 🎯 **Key Webmail Optimizations**

- **Webmail-first priority** as requested
- **Port 587 STARTTLS** for better cloud compatibility
- **Enhanced TLS settings** for webmail server compatibility
- **Extended timeouts** for cloud network latency
- **Automatic fallback** to port 465 if 587 fails
- **Gmail emergency backup** (optional)

## 🌟 **Alternative: Direct Webmail Contact**

If issues persist, consider contacting `radiant.herosite.pro` support:
- Request **cloud platform compatibility** information
- Ask about **port 587 STARTTLS** support
- Verify **firewall whitelist** requirements for Render

This configuration prioritizes your webmail SMTP while providing cloud-optimized settings! 🎉