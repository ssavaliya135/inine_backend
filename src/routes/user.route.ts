import express, { Router } from "express";
import {
  getUserByIdController,
  profileUpdateUserController,
  depositAmountController,
  withdrawAmountController,
} from "../controllers/user.controller";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";

const userRoute: Router = express.Router();

userRoute.patch("/profileUpdate", profileUpdateUserController);
userRoute.get("/", validateAuthIdToken, getUserByIdController);
userRoute.post("/deposit", validateAuthIdToken, depositAmountController);
userRoute.post("/withdraw", validateAuthIdToken, withdrawAmountController);

export default userRoute;
