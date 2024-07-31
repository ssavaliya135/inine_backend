import { Document, Schema, Types, model } from "mongoose";

export interface IAmount extends Document {
  _id?: string;
  month: string;
  depositAmount?: number;
  withDrawalAmount?: number;
  userId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const amount = new Schema<IAmount>(
  {
    month: {
      type: "string",
      default: "",
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    withDrawalAmount: {
      type: Number,
      default: 0,
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
