import { Document, Schema, Types, model } from "mongoose";

export interface IGroup extends Document {
  _id?: string;
  groupName: string;
  amount?: number;
  userId?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const group = new Schema<IGroup>(
  {
    groupName: {
      type: "string",
      default: "",
    },
    amount: {
      type: Number,
      default: 0,
    },
    userId: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
        default: null,
      },
    ],
  },
  { timestamps: true }
);

export const GroupModel = model<IGroup>("group", group);
