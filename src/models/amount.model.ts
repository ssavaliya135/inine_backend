import { Document, Schema, Types, model } from "mongoose";

export interface IAmount extends Document {
  _id?: string;
  month: string;
  amount?: number;
  paymentMode?: string;
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
    amount: {
      type: Number,
      default: 0,
    },
    paymentMode: {
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
