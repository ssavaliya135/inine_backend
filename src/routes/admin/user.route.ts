import express, { Router } from "express";
import {
  getAllUserAdminController,
  addPNLAdminController,
} from "../../controllers/admin/user.controller";

const adminUserRoute: Router = express.Router();

adminUserRoute.get("/", getAllUserAdminController);
adminUserRoute.post("/addPNL/:userId", addPNLAdminController);

export default adminUserRoute;
