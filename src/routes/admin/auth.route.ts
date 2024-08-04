import express, { Router } from "express";
import { validateAuthIdToken } from "../../middleware/validateAuthIdToken";
import { validateIsAdmin } from "../../middleware/validateIsAdmin";
import {
  adminLoginController,
  adminRegisterController,
  adminSessionController,
  adminLogoutController,
  adminUserRegisterController,
} from "../../controllers/admin/auth.controller";

const adminAuthtRoute: Router = express.Router();

adminAuthtRoute.post("/login", adminLoginController);
adminAuthtRoute.post("/register", adminRegisterController);
adminAuthtRoute.post("/userRegister", adminUserRegisterController);
adminAuthtRoute.post(
  "/session",
  validateAuthIdToken,
  validateIsAdmin,
  adminSessionController
);
adminAuthtRoute.post(
  "/logout",
  validateAuthIdToken,
  validateIsAdmin,
  adminLogoutController
);

export default adminAuthtRoute;
