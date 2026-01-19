import admin from 'firebase-admin';

// Load service account key from environment variable or file
let serviceAccount;

try {
  // Try loading from environment variable first (for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fallback to file (for development)
    serviceAccount = {
      "type": "service_account",
      "project_id": process.env.FIREBASE_PROJECT_ID,
      "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
      "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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