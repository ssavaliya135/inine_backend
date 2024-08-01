import { applicationDefault, initializeApp } from "firebase-admin/app";
export const firebase = () => {
  return initializeApp({
    credential: applicationDefault(),
  });
};
