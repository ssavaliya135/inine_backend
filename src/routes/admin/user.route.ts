import express, { Router } from "express";
import {
  getAllUserAdminController,
  addPNLAdminController,
  amountAdminController,
} from "../../controllers/admin/user.controller";

const adminUserRoute: Router = express.Router();

adminUserRoute.get("/", getAllUserAdminController);
adminUserRoute.post("/addPNL/:userId", addPNLAdminController);
adminUserRoute.post("/amount/:userId", amountAdminController);

export default adminUserRoute;
