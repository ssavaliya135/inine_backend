import express, { Router } from "express";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";
import { validateIsAdmin } from "../middleware/validateIsAdmin";
import adminAuthtRoute from "./admin/auth.route";
import adminUserRoute from "./admin/user.route";
import adminGroupRoute from "./admin/group.route";

const adminRoute: Router = express.Router();

adminRoute.use("/user", validateAuthIdToken, validateIsAdmin, adminUserRoute);

adminRoute.use("/auth", adminAuthtRoute);
adminRoute.use("/group", adminGroupRoute);

export default adminRoute;
