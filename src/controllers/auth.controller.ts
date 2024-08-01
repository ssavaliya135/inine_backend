import { Response } from "express";
import Joi from "joi";
import jwt, { Secret } from "jsonwebtoken";
import { IUser, UserModel } from "../models/user.model";
import { Request } from "../request";
import {
  getPopulatedUserById,
  getUserByEmail,
  getUserByPhoneNumber,
  saveUser,
  updateUser,
} from "../services/user.service";

export const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().optional(),
  email: Joi.string()
    .email()
    .required()
    .external(async (v: string) => {
      const user: IUser = await getUserByEmail(v);
      if (user) {
        throw new Error(
          "This email address is already associated with another account. Please use a different email address."
        );
      }
      return v;
    }),
  phoneNumber: Joi.string()
    .required()
    .external(async (v: string) => {
      const user = await getUserByPhoneNumber(v);
      if (user != null) {
        throw new Error(
          "This phoneNumber  is already associated with another account. Please use a different phoneNumber."
        );
      }
      return v;
    }),
  password: Joi.string()
    .required()
    .min(6)
    .custom((v) => {
      return jwt.sign(v, process.env.JWT_SECRET as Secret);
    }),
});

export const loginSchema = Joi.object({
  password: Joi.string().required(),
  phoneNumber: Joi.string()
    .required()
    .external(async (v: string) => {
      const user = await getUserByPhoneNumber(v);
      if (user.length == 0) {
        throw new Error(
          "This phoneNumber is not registered. Please use a registered phoneNumber."
        );
      }
      return user[0];
    }),
});

export const duplicateSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .external(async (v: string) => {
      const user: IUser = (await getUserByEmail(v)) as IUser;
      if (user) {
        throw new Error(
          "This email address is already associated with another account. Please use a different email address."
        );
      }
      return v;
    }),
});

export const registerController = async (req: Request, res: Response) => {
  try {
    const payloadValue = await registerSchema
      .validateAsync(req.body)
      .then((value) => {
        return value;
      })
      .catch((e) => {
        console.log(e);
        res.status(422).json({ message: e.message });
      });

    if (!payloadValue) {
      return;
    }

    if (payloadValue.phoneNumber) {
      const guestUser = await getUserByPhoneNumber(payloadValue.phoneNumber);
      if (guestUser != null) {
        return res.status(422).json({
          message: "please enter different phone number",
        });
      }
    }

    let user = await saveUser(
      new UserModel({
        ...payloadValue,
        isRegistered: true,
      })
    );

    const token = jwt.sign(
      { id: user._id?.toString() },
      process.env.JWT_SECRET as Secret
    );
    user.token = token;
    await updateUser(new UserModel(user));
    const newUser = await getPopulatedUserById(user._id);
    return res.status(200).set({ "x-auth-token": token }).json(newUser);
  } catch (error) {
    console.log(error);
    console.log("error", "error in register", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const payloadValue = await loginSchema
      .validateAsync(req.body)
      .then((value) => {
        return value;
      })
      .catch((e) => {
        console.log(e);
        res.status(422).json({ message: e.message });
      });

    if (!payloadValue) {
      return;
    }
    const user = payloadValue.phoneNumber;
    const password = jwt.verify(
      user.password,
      process.env.JWT_SECRET as Secret
    );
    if (password !== payloadValue.password) {
      return res.status(422).json({ message: "Password is incorrect" });
    }
    const populatedUser = await getPopulatedUserById(user._id);
    const token = jwt.sign(
      { id: user._id?.toString() },
      process.env.JWT_SECRET as Secret
    );
    return res.status(200).setHeader("x-auth-token", token).json(populatedUser);
  } catch (error) {
    console.log(error);
    console.log("error", "error in login with apple", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const token = req.body.token;
    const user = req.authUser;
    user.token = token;
    if (user) {
      await updateUser(new UserModel(user));
    }
    return res.status(200).json({ message: "Logout" });
  } catch (error) {
    console.log("error", "error in logout ", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const sessionController = async (req: Request, res: Response) => {
  try {
    let isAdmin = req.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({ message: "Unauthorized request." }).end();
    }
    let user = await getPopulatedUserById(req.authUser?._id || "");
    return res.status(200).json(user);
  } catch (error) {
    console.log("error at get session#################### ", error);

    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};
