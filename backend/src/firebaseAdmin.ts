import * as admin from 'firebase-admin';

const DATABASE_URL = 'https://finflow-aa069-default-rtdb.firebaseio.com';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: DATABASE_URL,
    projectId: 'finflow-aa069'
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.database();
console.log('🔥 Firebase Backend Service initialized -> https://finflow-aa069-default-rtdb.firebaseio.com');
