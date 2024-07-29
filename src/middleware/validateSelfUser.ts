import { NextFunction, Response } from "express";

import { Request } from "../request";
import { getUserById } from "../services/user.service";

export const validateSelfUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(422).json({ message: "Invalid User." });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(422).json({ message: "Invalid User." });
  }

  if (req.authUser._id.toString() !== userId) {
    return res.status(403).json({ message: "Unauthorized request." }).end();
  }
  req.userId = userId;
  next();
};
