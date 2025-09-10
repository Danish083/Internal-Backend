import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let adminApp = null;
let adminDb = null;
let adminAuth = null;

export const initializeFirebase = () => {
  try {
    // Initialize Firebase Admin SDK
    if (!adminApp) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}");
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
    }

    console.log("Connected to Firebase Admin SDK!");
  } catch (error) {
    console.log("Cannot connect to Firebase due to " + error.message);
    process.exit(1);
  }
};

export const getAdminFirestoreInstance = () => {
  if (!adminDb) {
    throw new Error(
      "Firebase Admin not initialized. Call initializeFirebase() first."
    );
  }
  return adminDb;
};

export const getAdminAuthInstance = () => {
  if (!adminAuth) {
    throw new Error(
      "Firebase Admin not initialized. Call initializeFirebase() first."
    );
  }
  return adminAuth;
};

export { adminApp, adminDb, adminAuth };
