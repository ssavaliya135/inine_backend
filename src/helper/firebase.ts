import { applicationDefault, initializeApp } from "firebase-admin/app";
export const firebase = () => {
  return initializeApp({
    credential: applicationDefault(),
  });
};

// import * as admin from "firebase-admin";
// import { initializeApp } from "firebase-admin/app";

// const serviceAccount = require("../../credentials/inine.json");

// export const firebase = () => {
//   return initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// };
