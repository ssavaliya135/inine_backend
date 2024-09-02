import { Response } from "express";
import Joi, { isError } from "joi";
import { calculateMonth, calculateTotalDays } from "../helper/calculation";
import { UserModel } from "../models/user.model";
import { Request } from "../request";
import {
  getAmountByUserId,
  getAmountByUserIdAndMonth,
} from "../services/amount.service";
import {
  getPopulatedUserById,
  getUserByEmail,
  updateUser,
} from "../services/user.service";
import {
  getPortfolioByUserId,
  getPortfolioByUserIdAndMonth,
} from "../services/portfolio.service";
const moment = require("moment");

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
});

export const getPortfolioSchema = Joi.object().keys({
  month: Joi.string().optional().allow(""),
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
    let { month } = calculateMonth(new Date());
    return res.status(200).json({ ...user, month });
  } catch (error) {
    console.log(
      "error",
      "error at getUserByIdController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const deleteAccountController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    const user = await getPopulatedUserById(authUser._id);
    user.isRegistered = false;
    user.isDeleted = false;
    await updateUser(new UserModel(user));
    return res.status(200).json(user);
  } catch (error) {
    console.log(
      "error",
      "error at deleteAccountController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getAmountController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let amount = await getAmountByUserId(authUser._id);
    // let { month } = calculateTotalDays();
    // let amount = await getAmountByUserIdAndMonth(authUser._id, month);
    return res.status(200).json(amount);
  } catch (error) {
    console.log(
      "error",
      "error at getAmountController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getPortfolioController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    const payloadValue = await getPortfolioSchema
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
    let portfolio = await getPortfolioByUserIdAndMonth(
      authUser._id,
      payloadValue.month
    );
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    portfolio.pnlList = portfolio.pnlList.reverse();
    // let { month } = calculateTotalDays();
    // let amount = await getPortfolioByUserIdAndMonth(authUser._id, month);
    return res.status(200).json(portfolio);
  } catch (error) {
    console.log(
      "error",
      "error at getPortfolioController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getMonthController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }

    let portfolio = await getPortfolioByUserId(authUser._id);
    // let { month } = calculateTotalDays();
    // let amount = await getPortfolioByUserIdAndMonth(authUser._id, month);
    // portfolio.pnlList = portfolio.pnlList.reverse();
    return res.status(200).json(portfolio);
  } catch (error) {
    console.log(
      "error",
      "error at getMonthController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getCurrentWeekPNLController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }

    let { month } = calculateMonth(new Date());
    let portfolio = await getPortfolioByUserIdAndMonth(authUser._id, month);

    // Get the current date
    const currentDate = moment();

    // Filter pnlList to only include current week's data
    const currentWeekPNL = portfolio.pnlList.filter((item) => {
      const itemDate = moment(item.date, "DD/MM/YYYY");
      return itemDate.isSame(currentDate, "week");
    });

    // Replace the original pnlList with the filtered list
    portfolio.pnlList = currentWeekPNL;

    return res.status(200).json(currentWeekPNL);
  } catch (error) {
    console.log(
      "error",
      "error at getCurrentWeekPNLController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};
