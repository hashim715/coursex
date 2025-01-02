import admin, { ServiceAccount } from "firebase-admin";
import * as serviceAccount from "../../service-account/coursex-service-account.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

export const firebase_admin = admin;
