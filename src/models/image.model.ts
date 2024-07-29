import { model, Schema, Types, Document } from "mongoose";
import { IUser } from "./user.model";


export interface IImage extends Document {
    _id?: string;
    description?: string;
    title?: string;
    imageURL?: string;
    thumbnail?: string;
    userId?: IUser | string;
    resolution?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
const image = new Schema<IImage>(
  {
    description: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    imageURL: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    userId: {
      type: Types.ObjectId,
      ref: "users",
      default: null,
    },
  },
  { timestamps: true }
);

export const ImageModel = model<IImage>("image", image);
