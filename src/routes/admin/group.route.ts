import express, { Router } from "express";
import { validateAuthIdToken } from "../../middleware/validateAuthIdToken";
import { validateIsAdmin } from "../../middleware/validateIsAdmin";
import {
  createGroupController,
  suiteController,
  suiteHistoryController,
  getGroupController,
  addUserInGroupController,
} from "../../controllers/admin/group.controller";

const adminGroupRoute: Router = express.Router();

adminGroupRoute.post(
  "/addUserInGroup/:userId",
  validateAuthIdToken,
  validateIsAdmin,
  addUserInGroupController
);
adminGroupRoute.post(
  "/",
  validateAuthIdToken,
  validateIsAdmin,
  createGroupController
);
adminGroupRoute.get(
  "/suite",
  validateAuthIdToken,
  validateIsAdmin,
  // suiteHistoryController
  suiteController
);
adminGroupRoute.get(
  "/suiteHistory",
  validateAuthIdToken,
  validateIsAdmin,
  suiteHistoryController
);
adminGroupRoute.get(
  "/",
  validateAuthIdToken,
  validateIsAdmin,
  getGroupController
);

export default adminGroupRoute;
