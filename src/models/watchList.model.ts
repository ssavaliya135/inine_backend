import { Document, Schema, Types, model } from "mongoose";

export interface IWatchList extends Document {
  _id?: string;
  leaderId?: Types.ObjectId;
  userId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const watchList = new Schema<IWatchList>(
  {
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
  },
  { timestamps: true }
);

export const WatchListModel = model<IWatchList>("watchList", watchList);
