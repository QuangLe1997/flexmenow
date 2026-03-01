import { initializeApp, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let db: Firestore;
let storage: Storage;
let auth: Auth;

/**
 * Initialize Firebase Admin SDK (singleton).
 * When deployed to Cloud Functions, default credentials are injected automatically.
 * For local development, set GOOGLE_APPLICATION_CREDENTIALS env var.
 */
function ensureInitialized(): void {
  if (getApps().length === 0) {
    app = initializeApp();
  } else {
    app = getApps()[0];
  }

  if (!db) {
    db = getFirestore(app);
    db.settings({ ignoreUndefinedProperties: true });
  }

  if (!storage) {
    storage = getStorage(app);
  }

  if (!auth) {
    auth = getAuth(app);
  }
}

export function getDb(): Firestore {
  ensureInitialized();
  return db;
}

export function getStorageInstance(): Storage {
  ensureInitialized();
  return storage;
}

export function getAuthInstance(): Auth {
  ensureInitialized();
  return auth;
}

export function getApp(): App {
  ensureInitialized();
  return app;
}
