import express, { Router } from "express";
import {
  getAllUserAdminController,
  addPNLAdminController,
  amountAdminController,
  searchUserAdminController,
  searchUserByNameAdminController,
} from "../../controllers/admin/user.controller";

const adminUserRoute: Router = express.Router();

adminUserRoute.get("/", getAllUserAdminController);
adminUserRoute.get("/searchUserByPhn/:phnNumber", searchUserAdminController);
adminUserRoute.get(
  "/searchUserByName/:firstName",
  searchUserByNameAdminController
);
adminUserRoute.post("/addPNL/:userId", addPNLAdminController);
adminUserRoute.post("/amount/:userId", amountAdminController);

export default adminUserRoute;
