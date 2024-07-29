import { Request as expresesRequest } from "express";
import { IUser } from "./models/user.model";

export interface Request extends expresesRequest {
  authUser?: IUser;
  userId?: string;
  isAdmin: boolean;
  files?:
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[];
}
