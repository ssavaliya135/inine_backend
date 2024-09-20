import express, { Router } from "express";
import {
  getUserByIdController,
  profileUpdateUserController,
  getAmountController,
  getPortfolioController,
  getMonthController,
  getCurrentWeekPNLController,
  getCurrentWeekTotalPNLController,
  deleteAccountController,
  getReferralController,
} from "../controllers/user.controller";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";

const userRoute: Router = express.Router();

userRoute.patch("/profileUpdate", profileUpdateUserController);
userRoute.get("/getAmount", validateAuthIdToken, getAmountController);
userRoute.post(
  "/getPortfolio/:userId",
  validateAuthIdToken,
  getPortfolioController
);
userRoute.get("/getMonth/:userId", validateAuthIdToken, getMonthController);
userRoute.get(
  "/getReferral/:userId",
  validateAuthIdToken,
  getReferralController
);
userRoute.get(
  "/getCurrentWeekPNL",
  validateAuthIdToken,
  getCurrentWeekPNLController
);
userRoute.get(
  "/getCurrentWeekTotalPNL/:userId",
  validateAuthIdToken,
  getCurrentWeekTotalPNLController
);
userRoute.get("/", validateAuthIdToken, getUserByIdController);
userRoute.delete(
  "/deleteAccount",
  validateAuthIdToken,
  deleteAccountController
);

export default userRoute;
