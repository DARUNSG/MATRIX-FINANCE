import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCtv7PwnIqhsR02jW_UVWLSK98PsZCB9lo",
  authDomain: "finflow-aa069.firebaseapp.com",
  databaseURL: "https://finflow-aa069-default-rtdb.firebaseio.com",
  projectId: "finflow-aa069",
  storageBucket: "finflow-aa069.firebasestorage.app",
  messagingSenderId: "853213697532",
  appId: "1:853213697532:web:b08a00820718b955464e79",
  measurementId: "G-M6SYZE9YTK"
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { browserLocalPersistence, browserSessionPersistence, setPersistence };

// System connection status ping
export function monitorFirebaseConnection(onStatusChange: (connected: boolean) => void) {
  const connectedRef = ref(rtdb, '.info/connected');
  return onValue(connectedRef, (snap) => {
    onStatusChange(snap.val() === true);
  });
}

// Log connection initialization
console.log('🔥 Firebase Initialized: Connected to finflow-aa069 (https://finflow-aa069-default-rtdb.firebaseio.com)');

// Analytics initialization (browser check)
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export default app;
