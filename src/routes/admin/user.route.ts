import express, { Router } from "express";
import {
  getAllUserAdminController,
  addPNLAdminController,
  amountAdminController,
  searchUserAdminController,
  searchUserByNameAdminController,
  sendNotificationController,
  updatePNLAdminController,
  addReferralController,
  getReferralController,
  getLastPortfolioController,
} from "../../controllers/admin/user.controller";

const adminUserRoute: Router = express.Router();

adminUserRoute.post("/sendNotification", sendNotificationController);
adminUserRoute.get("/searchUserByPhn/:phnNumber", searchUserAdminController);
adminUserRoute.get(
  "/searchUserByName/:firstName",
  searchUserByNameAdminController
);
adminUserRoute.post("/addPNL/:userId", addPNLAdminController);
adminUserRoute.post("/amount/:userId", amountAdminController);
adminUserRoute.patch("/updatePNL", updatePNLAdminController);
adminUserRoute.get("/getLastPortfolio/:userId", getLastPortfolioController);
adminUserRoute.post("/addReferral/:userId", addReferralController);
adminUserRoute.get("/getReferral/:userId", getReferralController);
adminUserRoute.get("/", getAllUserAdminController);

export default adminUserRoute;
