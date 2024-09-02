import express, { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  sessionController,
} from "../controllers/auth.controller";
import { validateAuthIdToken } from "../middleware/validateAuthIdToken";
const upload = require("../middleware/filesUpload");

const authRoute: Router = express.Router();

authRoute.post("/register", registerController);
authRoute.post("/login", loginController);
authRoute.post("/logout", validateAuthIdToken, logoutController);
authRoute.post("/session", validateAuthIdToken, sessionController);
authRoute.post(
  "/imageUpload",
  validateAuthIdToken,
  upload.single("profileImage"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded or invalid file type" });
    }

    // Return the path to the uploaded image
    res.json({ imageUrl: `/public/images/${req.file.filename}` });
  }
);

export default authRoute;
