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
  addLeaderUserController,
  getLeaderUserController,
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
adminUserRoute.get("/addLeaderUser/:userId", addLeaderUserController);
adminUserRoute.get("/getLeaderUser", getLeaderUserController);
adminUserRoute.get("/", getAllUserAdminController);

export default adminUserRoute;
