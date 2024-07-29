import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import { NextFunction, Response } from "express";
import { Request } from "../request";
import { getUserById } from "../services/user.service";
// import { set as setGlobalContext } from "express-http-context";

export const validateAuthIdToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  // console.log("token", token);

  if (!token) {
    res.status(403).json({ message: "Unauthorized request." });
    return;
  }

  const decode = jwt.verify(token, process.env.JWT_SECRET as Secret);
  // console.log(decode, ">>>>>>>>>>>>>>>>>");

  //@ts-ignore
  let userId = decode.id;
  if (!userId) {
    res.status(403).json({ message: "Unauthorized request." });
    return;
  }

  const user = await getUserById(userId as string);
  // console.log("user", user);

  if (!user) {
    res.status(403).json({ message: "Unauthorized request." });
    return;
  }

  const userRawData = user;
  delete userRawData.password;

  //@ts-ignore  ---> to check this
  req.authUser = userRawData;
  req.isAdmin = userRawData.userType === "ADMIN";
  // console.log(req.authUser, "@@@@@@@@@@@@@@@@@@@@@@");

  // setGlobalContext("authUser", userRawData);
  next();
  return;
};
