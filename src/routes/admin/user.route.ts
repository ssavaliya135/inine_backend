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
  addWatchListController,
  getWatchListController,
  getUserController,
  deleteWatchListController,
  deleteReferralController,
  deleteLeaderUserController,
  getHideUserController,
  hideUnhideUserController,
  editAmountAdminController,
  addGroupPNLAdminController,
  updateGroupPNLAdminController,
  getLifeTimeGroupPortfolioController,
  getHideUserController1,
  updateUserAdminController,
  deleteMonthlyHistoryController,
} from "../../controllers/admin/user.controller";

const adminUserRoute: Router = express.Router();

adminUserRoute.post("/sendNotification", sendNotificationController);
adminUserRoute.get("/searchUserByPhn/:phnNumber", searchUserAdminController);
adminUserRoute.get(
  "/searchUserByName/:firstName",
  searchUserByNameAdminController
);
adminUserRoute.post("/addPNL/:userId", addPNLAdminController);
adminUserRoute.post("/addGroupPNL/:groupId", addGroupPNLAdminController);
adminUserRoute.post("/amount/:userId", amountAdminController);
adminUserRoute.patch("/updateUser", updateUserAdminController);
adminUserRoute.patch("/updatePNL", updatePNLAdminController);
adminUserRoute.patch("/updateGroupPNL", updateGroupPNLAdminController);
adminUserRoute.get("/getLastPortfolio/:userId", getLastPortfolioController);
adminUserRoute.post("/addReferral/:userId", addReferralController);
adminUserRoute.post("/deleteReferral/:userId", deleteReferralController);
adminUserRoute.get("/getReferral/:userId", getReferralController);
adminUserRoute.get("/addLeaderUser/:userId", addLeaderUserController);
adminUserRoute.get("/deleteLeaderUser/:userId", deleteLeaderUserController);
adminUserRoute.get("/getLeaderUser", getLeaderUserController);
adminUserRoute.post("/addWatchList/:userId", addWatchListController);
adminUserRoute.get("/getWatchList/:userId", getWatchListController);
adminUserRoute.delete("/deleteWatchList/:id", deleteWatchListController);
adminUserRoute.delete(
  "/deleteMonthlyHistory/:id",
  deleteMonthlyHistoryController
);
adminUserRoute.get("/getUser", getUserController);
adminUserRoute.get("/getHideUser1", getHideUserController1);
adminUserRoute.get("/getHideUser", getHideUserController);
adminUserRoute.post("/hideUnhideUser", hideUnhideUserController);
adminUserRoute.post("/editAmountAdmin/:userId", editAmountAdminController);
adminUserRoute.get(
  "/getLifeTimeGroupPortfolio/:userId",
  getLifeTimeGroupPortfolioController
);
adminUserRoute.get("/", getAllUserAdminController);

export default adminUserRoute;
