import admin, { ServiceAccount } from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const serviceAccount: ServiceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_CREDENTIALS as string
);

export const firebase_admin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
