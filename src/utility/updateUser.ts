const dotenv = require("dotenv");
dotenv.config();
import { connectDb } from "../dbConnections";
import { UserModel } from "../models/user.model";
import { updateUser } from "../services/user.service";

connectDb()
  .then(() => {
    const updateFUnction = async () => {
      console.log("start");

      let users = await UserModel.find();
      users.forEach(async (user) => {
        user.isHide = false;
        await updateUser(user);
      });
      console.log("done");
    };
    updateFUnction();
  })
  .catch((err) => console.log(err));
