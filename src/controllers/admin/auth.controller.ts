import { Response } from "express";
import { Request } from "../../request";
import Joi, { isError } from "joi";
import jwt, { Secret } from "jsonwebtoken";
import {
  getPopulatedUserById,
  getUserByEmail,
  getUserByPhoneNumber,
  saveUser,
  updateUser,
} from "../../services/user.service";
import { IUser, UserModel } from "../../models/user.model";

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .external(async (v: string) => {
      const user: IUser = await getUserByEmail(v);
      if (!user) {
        throw new Error(
          "This email address is not registered. Please use a registered email address."
        );
      }
      return user;
    }),
  password: Joi.string().required(),
});

const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  // lastName: Joi.string().required(),
  // otp: Joi.string().length(6).required(),
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
      if (user.length > 0) {
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

  // pushToken: Joi.string().optional().disallow(null).allow(""),
});

export const adminRegisterController = async (req: Request, res: Response) => {
  try {
    const payloadValue = await registerSchema
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

    const user = await saveUser(
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
    console.log("error in register", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const adminLoginController = async (req: Request, res: Response) => {
  try {
    const payloadValue = await loginSchema
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
    const user = payloadValue.email;
    if (user.userType !== "ADMIN") {
      return res.status(422).json({ message: "You are not admin" });
    }
    if (!user) {
      return res.status(422).json({ message: "User not found" });
    }
    const password = jwt.verify(
      user.password,
      process.env.JWT_SECRET as Secret
    );
    if (password !== payloadValue.password) {
      return res.status(422).json({ message: "Password is incorrect" });
    }

    const populatedUser = await getPopulatedUserById(user._id);

    // const token = AES.encrypt(
    //   user.email,
    //   process.env.ADMIN_AES_KEY
    // ).toString();

    const token = jwt.sign(
      { id: user._id?.toString() },
      process.env.JWT_SECRET as Secret
    );
    return res.status(200).setHeader("x-auth-token", token).json(populatedUser);
  } catch (error) {
    console.log("error", "error in Admin_Login", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const adminSessionController = async (req: Request, res: Response) => {
  try {
    const isAdmin = req.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({ message: "Unauthorized request." }).end();
    }
    const user = await getPopulatedUserById(req.authUser._id);
    return res.status(200).json(user);
  } catch (error) {
    console.log("error at get session#################### ", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const adminLogoutController = async (req: Request, res: Response) => {
  try {
    const user = req.authUser;
    const token = req.body.token;

    user.token = token;
    //   await updateUser(new User({ ...user }));
    await updateUser(new UserModel({ ...user }));

    return res.status(200).json({ message: "Logout" });
  } catch (error) {
    console.log("error", "error in logout ", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};
