import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "flexme-now.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "flexme-now",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "flexme-now.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "585110904868",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:585110904868:web:0932f52351196385a378b1",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const clientAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
