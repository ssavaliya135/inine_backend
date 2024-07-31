import express, { Router } from "express";
import {
  getUserByIdController,
  profileUpdateUserController,
  getAmountController,
  getPortfolioController,
} from "../controllers/user.controller";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";

const userRoute: Router = express.Router();

userRoute.patch("/profileUpdate", profileUpdateUserController);
userRoute.get("/", validateAuthIdToken, getUserByIdController);
userRoute.get("/getAmount", validateAuthIdToken, getAmountController);
userRoute.get("/getPortfolio", validateAuthIdToken, getPortfolioController);

export default userRoute;
