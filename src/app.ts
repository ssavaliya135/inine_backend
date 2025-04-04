import cors from "cors";
import express from "express";
import { connectDb } from "./dbConnections";
const admin = require("firebase-admin");
const path = require("path");
console.log(__dirname, "????????");
console.log(process.cwd(), ">>>>>>>>");
var cron = require("node-cron");

// cron.schedule("0 0 * * *", async () => {
//   let users = await findUser({ query: { isHide: true } });
//   users.forEach(async (user) => {
//     user.isHide = false;
//     await updateUser(user);
//   });
//   console.log("running a task every minute");
// });
const firebaseConfigPath = path.join(
  process.cwd(),
  "credentials",
  "inine.json"
);

// Initialize Firebase Admin SDK
try {
  const firebaseConfig = require(firebaseConfigPath);
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  process.exit(1);
}
// import { firebase } from "./helper/firebase";
const dotenv = require("dotenv");
dotenv.config();
// firebase();
import adminRoute from "./routes/admin.route";
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";
import { findUser, updateUser } from "./services/user.service";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: "x-auth-token",
  })
);
app.set("view engine", "ejs"); // setting EJS as template engine
//for live
// app.set("views", path.join(process.cwd(), "src", "views")); // reference to the src folder
app.set("views", path.join(__dirname, "views")); // setting views directory
app.use("/public", express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  const info = req.method + " " + res.statusCode + " " + req.url;
  console.log("API HIT -------------->", info, "\n|\nv\n|\nv\n");
  next();
});

app.use("/admin", adminRoute);
app.use("/auth", authRoute);
app.use("/user", userRoute);

connectDb()
  .then(() => {
    app.set("port", port);
    app.listen(port, async function () {
      console.log(
        `App listening on environment "${process.env.NODE_ENV}" ${port}`
      );
    });
  })
  .catch((error) => {
    console.error("Error starting the server", error);
  });

export default app;
