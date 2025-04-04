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
  referredBy: Types.ObjectId;
  referrals: Types.ObjectId[];
  groupMembers: Types.ObjectId[];
  isLeader: boolean;
  isHide: boolean;
  groupId: Types.ObjectId;
}

const user = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: false,
      default: "",
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
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    referrals: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
        default: null,
      },
    ],
    isLeader: {
      type: Boolean,
      default: false,
    },
    isHide: {
      type: Boolean,
      default: false,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    groupMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
        default: null,
      },
    ],
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("users", user);
