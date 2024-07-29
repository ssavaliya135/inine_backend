import express, { Router } from "express";
import {
  getUserByIdController,
  profileUpdateUserController,
} from "../controllers/user.controller";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";

const userRoute: Router = express.Router();

userRoute.patch("/profileUpdate", profileUpdateUserController);
userRoute.get("/", validateAuthIdToken, getUserByIdController);

export default userRoute;
