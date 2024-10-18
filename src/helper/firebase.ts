// import { applicationDefault, initializeApp } from "firebase-admin/app";
// export const firebase = () => {
//   return initializeApp({
//     credential: applicationDefault(),
//   });
// };

// import * as admin from "firebase-admin";
// import { initializeApp } from "firebase-admin/app";

// const serviceAccount = require("../../credentials/inine.json");

// export const firebase = () => {
//   return initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// };
const admin = require("firebase-admin");
const firebaseConfigPath = path.join(__dirname, "credentials", "inine.json");

// Initialize Firebase Admin SDK
try {
  const firebaseConfig = require(firebaseConfigPath);
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  process.exit(1);
}
