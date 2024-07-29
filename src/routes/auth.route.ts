import express, { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  sessionController,
} from "../controllers/auth.controller";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";

const authRoute: Router = express.Router();

authRoute.post("/register", registerController);
authRoute.post("/login", loginController);
authRoute.post("/logout", validateAuthIdToken, logoutController);
authRoute.post("/session", validateAuthIdToken, sessionController);

export default authRoute;
