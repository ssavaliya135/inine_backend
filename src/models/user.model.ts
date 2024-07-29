import { Document, Schema, Types, model } from "mongoose";

export interface IUser extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  userType: string;
  password: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  isRegistered: boolean;
  email: string;
  token: string;
}

export const UserDefaults = {
  firebaseUserId: "",
  FCMToken: [],
};

const user = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    userType: {
      type: String,
      default: "USER",
    },
    password: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("users", user);
