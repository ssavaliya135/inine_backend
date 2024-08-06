import express, { Router } from "express";
import {
  getUserByIdController,
  profileUpdateUserController,
  getAmountController,
  getPortfolioController,
  getMonthController,
  getCurrentWeekPNLController,
} from "../controllers/user.controller";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";

const userRoute: Router = express.Router();

userRoute.patch("/profileUpdate", profileUpdateUserController);
userRoute.get("/getAmount", validateAuthIdToken, getAmountController);
userRoute.post("/getPortfolio", validateAuthIdToken, getPortfolioController);
userRoute.get("/getMonth", validateAuthIdToken, getMonthController);
userRoute.get(
  "/getCurrentWeekPNL",
  validateAuthIdToken,
  getCurrentWeekPNLController
);
userRoute.get("/", validateAuthIdToken, getUserByIdController);

export default userRoute;
