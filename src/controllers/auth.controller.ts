import { Response } from "express";
import Joi from "joi";
import jwt, { Secret } from "jsonwebtoken";
import { IUser, UserModel } from "../models/user.model";
import { Request } from "../request";
import {
  getNotRegisterUserByPhoneNumber,
  getPopulatedUserById,
  getUserByEmail,
  getUserByPhoneNumber,
  saveUser,
  updateUser,
} from "../services/user.service";

export const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  email: Joi.string()
    .email()
    .required()
    .external(async (v: string) => {
      const user: IUser = await getUserByEmail(v);
      if (user) {
        throw new Joi.ValidationError(
          "This email address is already associated with another account. Please use a different email address.",
          [
            {
              message:
                "This email address is already associated with another account. Please use a different email address.",
              path: ["email"],
              type: "any.custom",
            },
          ],
          v
        );
      }
      return v;
    }),
  phoneNumber: Joi.string()
    .required()
    .external(async (v: string) => {
      const user = await getNotRegisterUserByPhoneNumber(v);
      if (user) {
        throw new Joi.ValidationError(
          "This phoneNumber  is already registered. Please try again",
          [
            {
              message:
                "This phoneNumber  is already registered. Please try again",
              path: ["email"],
              type: "any.custom",
            },
          ],
          v
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
  FCMToken: Joi.string().required(),
});

export const loginSchema = Joi.object({
  password: Joi.string().required(),
  FCMToken: Joi.string().required(),
  phoneNumber: Joi.string()
    .required()
    .external(async (v: string) => {
      const user = await getUserByPhoneNumber(v);
      if (user.length == 0) {
        throw new Joi.ValidationError(
          "This phone number is not registered. Please use a registered phone number.",
          [
            {
              message:
                "This phone number is not registered. Please use a registered phone number.",
              path: ["email"],
              type: "any.custom",
            },
          ],
          v
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
        throw new Joi.ValidationError(
          "This email address is already associated with another account. Please use a different email address.",
          [
            {
              message:
                "This email address is already associated with another account. Please use a different email address.",
              path: ["email"],
              type: "any.custom",
            },
          ],
          v
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
        res.status(422).json({ message: e.details[0].message });
      });

    if (!payloadValue) {
      return;
    }
    let isRegistered = true;
    const guestUser = await getUserByPhoneNumber(payloadValue.phoneNumber);

    let token;
    if (guestUser.length == 0) {
      isRegistered = false;

      let user = await saveUser(
        new UserModel({ ...payloadValue, isRegistered })
      );
      token = jwt.sign(
        { id: user._id?.toString() },
        process.env.JWT_SECRET as Secret
      );
      user.token = token;
      await updateUser(new UserModel(user));
      return res.status(200).set({ "x-auth-token": token }).json(user);
    } else {
      console.log("elseeeeeeeeeeeeee");

      if (guestUser[0].email !== "" && guestUser[0].isDeleted == false) {
        console.log("ifffffffffffff");

        return res
          .status(400)
          .json({ message: "This phone number is already registered." });
      }
      token = jwt.sign(
        { id: guestUser[0]._id?.toString() },
        process.env.JWT_SECRET as Secret
      );
      guestUser[0].firstName = payloadValue.firstName;
      guestUser[0].isRegistered = isRegistered;
      guestUser[0].FCMToken = [payloadValue.FCMToken];
      guestUser[0].token = token;
      guestUser[0].email = payloadValue.email;
      guestUser[0].password = payloadValue.password;
      await updateUser(new UserModel(guestUser[0]));
      const newUser = await getPopulatedUserById(guestUser[0]._id);
      return res.status(200).set({ "x-auth-token": token }).json(newUser);
    }
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
        res.status(422).json({ message: e.details[0].message });
      });

    if (!payloadValue) {
      return;
    }
    const user = payloadValue.phoneNumber;
    if (user.password == "") {
      return res.status(400).json({ message: "Please register an account." });
    }
    const password = jwt.verify(
      user.password,
      process.env.JWT_SECRET as Secret
    );
    if (password !== payloadValue.password) {
      return res.status(422).json({ message: "Password is incorrect" });
    }
    if (user.FCMToken.indexOf(payloadValue.FCMToken) == -1) {
      user.FCMToken.push(payloadValue.FCMToken);
      await updateUser(new UserModel(user));
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
