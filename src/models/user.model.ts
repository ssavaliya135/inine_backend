import { Document, Schema, Types, model } from "mongoose";

export interface IUser extends Document {
  _id: string;
  firstName: string;
  FCMToken: string[];
  userType: string;
  password: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  isRegistered: boolean;
  isDeleted: boolean;
  email: string;
  token: string;
}

const user = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: false,
    },
    FCMToken: [
      {
        type: String,
      },
    ],
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
    isDeleted: {
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
