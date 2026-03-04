import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

let app: App;

if (!getApps().length) {
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET || "flexme-now.firebasestorage.app";

  // Use service account JSON from env var (for Vercel / production)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucket,
    });
  } else {
    // Local dev: uses Application Default Credentials (gcloud CLI / Firebase CLI token)
    app = initializeApp({ storageBucket: bucket, projectId: "flexme-now" });
  }
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
