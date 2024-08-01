import express, { Router } from "express";
import {
  getUserByIdController,
  profileUpdateUserController,
  getAmountController,
  getPortfolioController,
  getMonthController,
} from "../controllers/user.controller";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";

const userRoute: Router = express.Router();

userRoute.patch("/profileUpdate", profileUpdateUserController);
userRoute.get("/", validateAuthIdToken, getUserByIdController);
userRoute.get("/getAmount", validateAuthIdToken, getAmountController);
userRoute.post("/getPortfolio", validateAuthIdToken, getPortfolioController);
userRoute.get("/getMonth", validateAuthIdToken, getMonthController);

export default userRoute;
