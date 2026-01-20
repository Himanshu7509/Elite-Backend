import admin from 'firebase-admin';

// Load service account key from environment variable or file
let serviceAccount;

try {
  // Try loading from environment variable first (for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fallback to file (for development)
    // Handle private key with proper newline conversion for different environments
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    // Handle different newline representations that might occur in environment variables
    // This handles multiple encoding scenarios for different deployment platforms
    if (privateKey && typeof privateKey === 'string') {
      // Replace various newline formats that might be present in the environment variable
      // Handle different possible escape sequences for newlines
      // First, replace double-escaped newlines (\\n -> \n)
      privateKey = privateKey.replace(/\\\\n/g, '\\n');
      
      // Then ensure proper newline characters are used in the PEM format
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Additional check: ensure the private key has proper PEM format
      if (privateKey && !privateKey.startsWith('-----BEGIN')) {
        console.error('Warning: Firebase private key does not start with proper PEM header.');
        console.error('Private key should start with "-----BEGIN PRIVATE KEY-----"');
        console.error('Current key starts with:', privateKey.substring(0, 50));
      }
      
      // Log key length for debugging (should be much longer than 75 chars)
      if (privateKey) {
        console.log('Firebase private key length:', privateKey.length);
        if (privateKey.length < 500) {
          console.warn('Warning: Firebase private key appears to be unusually short (< 500 chars)');
        }
      }
    }
    
    serviceAccount = {
      "type": "service_account",
      "project_id": process.env.FIREBASE_PROJECT_ID,
      "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
      "private_key": privateKey,
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
      "client_id": process.env.FIREBASE_CLIENT_ID,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
    };
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
} catch (error) {
  console.error('Firebase admin initialization error:', error);
  console.error('Error details:', error.code, error.message);
  
  // Log which environment variables are available for debugging
  console.error('Available Firebase env vars:');
  console.error('- FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
  console.error('- FIREBASE_PRIVATE_KEY_ID:', !!process.env.FIREBASE_PRIVATE_KEY_ID);
  console.error('- FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
  console.error('- FIREBASE_SERVICE_ACCOUNT exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
  
  if (process.env.FIREBASE_PRIVATE_KEY) {
    console.error('- Private key length:', process.env.FIREBASE_PRIVATE_KEY.length);
    console.error('- Private key starts with:', process.env.FIREBASE_PRIVATE_KEY.substring(0, 50));
    console.error('- Private key ends with:', process.env.FIREBASE_PRIVATE_KEY.substring(Math.max(0, process.env.FIREBASE_PRIVATE_KEY.length - 50)));
  }
  
  // Check if we should try alternative initialization method
  console.error('Please verify that your Firebase private key in environment variables is properly formatted');
  console.error('A valid private key should be in PEM format starting with "-----BEGIN PRIVATE KEY-----"');
  console.error('and ending with "-----END PRIVATE KEY-----", with proper newlines in between');
}

export const sendPushNotification = async (tokens, payload) => {
  try {
    const response = await admin.messaging().sendMulticast({
      tokens: Array.isArray(tokens) ? tokens : [tokens],
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/favicon.ico'
      },
      data: payload.data || {},
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body
            },
            sound: 'default'
          }
        }
      },
      android: {
        notification: {
          icon: payload.icon || '/favicon.ico',
          color: '#3b82f6', // Tailwind blue-500
          sound: 'default'
        }
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    throw error;
  }
};

export const getMessaging = () => admin.messaging();
export default admin;