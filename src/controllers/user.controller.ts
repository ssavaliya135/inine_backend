import { Response } from "express";
import Joi, { isError } from "joi";
import { UserModel } from "../models/user.model";
import { Request } from "../request";
import {
  getPopulatedUserById,
  getUserByEmail,
  updateUser,
} from "../services/user.service";

export const profileUpdateSchema = Joi.object().keys({
  // profileImage: Joi.string()
  //   .optional()
  //   .external(async (v: string) => {
  //     if (!v) return v;
  //     const image = await getImageById(v);
  //     if (!image) {
  //       throw new Error("Please provide valid image for logo.");
  //     }
  //     return v;
  //   })
  //   .allow(null),
  email: Joi.string().email().optional(),
  firstName: Joi.string().optional().allow(""),
  lastName: Joi.string().optional().allow(""),
});

export const profileUpdateUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res
        .status(403)
        .send({ message: "unauthorized access to profile" });
    }
    const payloadValue = await profileUpdateSchema
      .validateAsync(req.body)
      .then((value) => {
        return value;
      })
      .catch((e) => {
        console.log(e);
        if (isError(e)) {
          res.status(422).json(e);
        } else {
          res.status(422).json({ message: e.message });
        }
      });

    if (!payloadValue) {
      return;
    }
    if (payloadValue.email) {
      const existingUser = await getUserByEmail(payloadValue.email);
      if (existingUser) {
        if (existingUser._id.toString() !== authUser._id.toString()) {
          return res.status(422).json({
            message:
              "This email address is already associated with another account. Please use a different email address.",
          });
        }
      }
      // }
      // const toBeUpdatedAccount = new User({
      //   ...authUser,
      //   ...payloadValue,
      // });
      // }
      const toBeUpdatedAccount = new UserModel({
        ...authUser,
        ...payloadValue,
      });

      await updateUser(toBeUpdatedAccount);
      const populatedUser = await getPopulatedUserById(req.userId);
      return res.status(200).json(populatedUser);
    }
  } catch (error) {
    console.log(
      "error",
      "error at profileUpdate user#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    const user = await getPopulatedUserById(authUser._id);
    return res.status(200).json(user);
  } catch (error) {
    console.log(
      "error",
      "error at get getUserById#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};