import cors from "cors";
import express from "express";
import { connectDb } from "./dbConnections";
import adminRoute from "./routes/admin.route";
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";
import { getRenamingSubscribedUser } from "./services/user.service";

const dotenv = require("dotenv");
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: "x-auth-token",
  })
);
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
