import { model, Schema, Types, Document } from "mongoose";
import { IUser } from "./user.model";

export interface IAmount extends Document {
  _id?: string;
  depositAmount?: string;
  withDrawalAmount?: string;
  userId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const amount = new Schema<IAmount>(
  {
    depositAmount: {
      type: String,
      default: "",
    },
    withDrawalAmount: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
  },
  { timestamps: true }
);

export const AmountModel = model<IAmount>("amount", amount);
