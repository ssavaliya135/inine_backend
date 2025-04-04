import { Response } from "express";
import Joi, { isError } from "joi";
import jwt, { Secret } from "jsonwebtoken";
import {
  calculateMonth,
  calculateWeekdayPNLSummary,
} from "../helper/calculation";
import { UserModel } from "../models/user.model";
import { Request } from "../request";
import {
  deleteAmount,
  getAmountByUserId,
  getAmountByUserIdAndMonth,
} from "../services/amount.service";
import {
  deletePortfolio,
  getPortfolioByUserId,
  getPortfolioByUserIdAndMonth,
  updatePortfolio,
} from "../services/portfolio.service";
import {
  deleteUser,
  getPopulatedUserById,
  getPopulatedUserById1,
  getUserByEmail,
  getUserById,
  updateUser,
} from "../services/user.service";
import { sendMail } from "../helper/sendMail";
import { updatePNLCalculation1 } from "./admin/user.controller";
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
    const user = await getPopulatedUserById1(authUser._id);
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
    let userId = req.query.userId.toString();
    let user;
    if (userId) {
      user = await getPopulatedUserById(userId);
    } else {
      user = await getPopulatedUserById(authUser._id);
    }
    user.isRegistered = false;
    user.isDeleted = true;
    let leaderUser = await getUserById(user.groupId);
    if (leaderUser) {
      let groupMember = leaderUser.groupMembers.filter(
        (member) => member.toString() != userId.toString()
      );
      leaderUser.groupMembers = groupMember;
      await updateUser(new UserModel(leaderUser));
    }
    user.groupId = null;

    await updateUser(new UserModel(user));
    let portfolioList = await getPortfolioByUserId(user.id);
    portfolioList.forEach(async (portfolio) => {
      portfolio.isDeleted = true;
      await updatePortfolio(portfolio);
    });
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

const deleteData = async (user) => {
  console.log(user, "suruuuuuuuuuuuuuuuuuu");

  let amountList = await getAmountByUserId(user);
  amountList.forEach(async (amount) => {
    console.log(amount, ">>>>>>>>>>>>>>>>>>");

    await deleteAmount(amount._id);
  });
  let portfolioList = await getPortfolioByUserId(user);
  portfolioList.forEach(async (portfolio) => {
    console.log(portfolio, "#########@@@@@@@@@@@@@@@@-------------");

    await deletePortfolio(portfolio._id);
    portfolio.isDeleted = true;
    // await updatePortfolio(portfolio);
  });
  await deleteUser(user);
};

export const deleteAccountController1 = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let userId = req.query.userId.toString();
    let user;
    if (userId) {
      user = await getPopulatedUserById(userId);
      console.log(user, "#########");
      if (user.userType == "USER") {
        let groupLeader = await getPopulatedUserById(user.groupId);
        if (groupLeader) {
          let members = groupLeader.groupMembers.filter(
            (groupMember) => groupMember.toString() != user._id.toString()
          );
          groupLeader.groupMembers = members;
          console.log(groupLeader.groupMembers, "????????????//");

          await updateUser(groupLeader);
        }
        user.groupMembers.forEach(async (user) => {
          await deleteData(user);
        });
        await deleteData(user);
      }

      // let portfolioList = await getPortfolioByUserId(user.id);
      // let amountList = await getAmountByUserId(user.id);
      // amountList.forEach(async (amount) => {
      //   await deleteAmount(amount._id);
      // });
      // portfolioList.forEach(async (portfolio) => {
      //   await deletePortfolio(portfolio._id);
      //   portfolio.isDeleted = true;
      //   // await updatePortfolio(portfolio);
      // });
    } else {
      let payloadValue;
      user = await getPopulatedUserById(authUser._id);
      let groupLeader = await getPopulatedUserById(user.groupId);
      if (groupLeader) {
        let members = groupLeader.groupMembers.filter(
          (groupMember) => groupMember.toString() != user._id.toString()
        );
        groupLeader.groupMembers = members;
        console.log(groupLeader.groupMembers, "????????????//");

        await updateUser(groupLeader);
        let { month } = calculateMonth(new Date());
        let amount = await getAmountByUserIdAndMonth(user._id, month);
        let grouPortfolio = await getPortfolioByUserIdAndMonth(
          user.groupId,
          month
        );
        payloadValue.pnlList = grouPortfolio.pnlList;
        payloadValue.groupPnlList = grouPortfolio.pnlList;
        payloadValue.pnl = grouPortfolio.totalPnlValue;
        grouPortfolio.pnlList = [];
        grouPortfolio.totalCapital = grouPortfolio.totalCapital - amount.amount;
        grouPortfolio.tax = 0;
        grouPortfolio.totalPnlValue = 0;
        grouPortfolio.totalROI = 0;
        grouPortfolio.winDays = 0;
        grouPortfolio.winRation = 0;
        grouPortfolio.avgProfit = 0;
        grouPortfolio.totalWinProfit = 0;
        grouPortfolio.maxProfit = 0;
        grouPortfolio.todayPNL = 0;
        grouPortfolio.currentWeekPNL = 0;
        grouPortfolio.currentMonthPNL = 0;
        grouPortfolio.currentDD = 0;
        grouPortfolio.lossDays = 0;
        grouPortfolio.lossRation = 0;
        grouPortfolio.avgLoss = 0;
        grouPortfolio.totalLoss = 0;
        grouPortfolio.maxLoss = 0;
        grouPortfolio.maxWinStreak = 0;
        grouPortfolio.maxLossStreak = 0;
        grouPortfolio.MDD = 0;
        grouPortfolio.MDDRatio = 0;
        grouPortfolio.riskReward = 0;
        grouPortfolio.expectancy = 0;
        let data = await updatePNLCalculation1(
          payloadValue,
          grouPortfolio,
          grouPortfolio.totalCapital
        );
        for (let user of groupLeader.groupMembers) {
          let userPortfolio = await getPortfolioByUserIdAndMonth(
            user._id.toString(),
            month
          );
          if (!userPortfolio) {
            return res
              .status(410)
              .json({ message: "You have to add deposit first" });
          }
          payloadValue.pnlList = userPortfolio.pnlList;
          // payloadValue.pnl = grouPortfolio.totalPnlValue;
          userPortfolio.pnlList = [];
          userPortfolio.totalCapital =
            userId == user._id.toString()
              ? payloadValue.amount
              : userPortfolio.totalCapital;
          userPortfolio.tax = 0;
          userPortfolio.totalPnlValue = 0;
          userPortfolio.totalROI = 0;
          userPortfolio.winDays = 0;
          userPortfolio.winRation = 0;
          userPortfolio.avgProfit = 0;
          userPortfolio.totalWinProfit = 0;
          userPortfolio.maxProfit = 0;
          userPortfolio.todayPNL = 0;
          userPortfolio.currentWeekPNL = 0;
          userPortfolio.currentMonthPNL = 0;
          userPortfolio.currentDD = 0;
          userPortfolio.lossDays = 0;
          userPortfolio.lossRation = 0;
          userPortfolio.avgLoss = 0;
          userPortfolio.totalLoss = 0;
          userPortfolio.maxLoss = 0;
          userPortfolio.maxWinStreak = 0;
          userPortfolio.maxLossStreak = 0;
          userPortfolio.MDD = 0;
          userPortfolio.MDDRatio = 0;
          userPortfolio.riskReward = 0;
          userPortfolio.expectancy = 0;
          data = await updatePNLCalculation1(
            payloadValue,
            userPortfolio,
            grouPortfolio.totalCapital
          );
        }
        await deleteData(user);
      }

      // let portfolioList = await getPortfolioByUserId(user.id);
      // portfolioList.forEach(async (portfolio) => {
      //   await deletePortfolio(portfolio._id);
      //   // portfolio.isDeleted = true;
      //   // await updatePortfolio(portfolio);
      // });
      // let amountList = await getAmountByUserId(user.id);
      // amountList.forEach(async (amount) => {
      //   await deleteAmount(amount._id);
      // });
    }
    // user.isRegistered = false;
    // user.isDeleted = true;
    // let leaderUser = await getUserById(user.groupId);
    // if (leaderUser) {
    //   let groupMember = leaderUser.groupMembers.filter(
    //     (member) => member.toString() != userId.toString()
    //   );
    //   leaderUser.groupMembers = groupMember;
    //   await updateUser(new UserModel(leaderUser));
    // }
    // user.groupId = null;

    // await updateUser(new UserModel(user));
    // let portfolioList = await getPortfolioByUserId(user.id);
    // portfolioList.forEach(async (portfolio) => {
    //   portfolio.isDeleted = true;
    //   await updatePortfolio(portfolio);
    // });
    return res.status(200).json(user);
  } catch (error) {
    console.log(
      "error",
      "error at deleteAccountController1#################### ",
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
    let userId = req.params.userId;
    if (!userId) {
      return res.status(403).json("unauthorized request");
    }
    let user = await getUserById(userId);
    if (!user) {
      return res.status(403).json("user not found");
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
      user._id,
      payloadValue.month
    );
    console.log(user._id, payloadValue.month, ":::::::::::::::::");

    console.log(portfolio, "portfolioooooooo");

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
    let userId = req.params.userId;
    if (!userId) {
      return res.status(403).json("unauthorized request");
    }
    let user = await getUserById(userId);
    if (!user) {
      return res.status(403).json("user not found");
    }
    let portfolio = await getPortfolioByUserId(user._id);
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

export const getCurrentWeekTotalPNLController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let userId = req.params.userId;
    if (!userId) {
      return res.status(403).json("invalid userId");
    }
    let user = await getUserById(userId);
    if (!user) {
      return res.status(403).json("user not found");
    }

    let { month } = calculateMonth(new Date());
    let portfolio = await getPortfolioByUserIdAndMonth(user._id, month);
    const weekdayPNLSummary = calculateWeekdayPNLSummary(portfolio);

    return res.status(200).json(weekdayPNLSummary);
  } catch (error) {
    console.log(
      "error",
      "error at getCurrentWeekTotalPNLController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getReferralController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let userId = req.params.userId;
    if (!userId) {
      return res.status(403).json("unauthorized request");
    }
    let user = await getUserById(userId);
    if (!user) {
      return res.status(403).json("user not found");
    }
    let populatedUser = await getPopulatedUserById(userId);
    res.status(200).json(populatedUser.referrals);
  } catch (error) {
    console.log(
      "error",
      "error at getReferralController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const forgetPassController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    let user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate a JWT token for password reset
    let token = jwt.sign(
      { id: user._id?.toString() },
      process.env.JWT_SECRET as Secret
    );

    // Create a reset password URL
    // const resetLink = `http://localhost:9000/user/resetPassword/${token}`;
    const resetLink = `http://3.109.157.3:9000/user/resetPassword/${token}`;
    await sendMail(
      email,
      "Password Reset",
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f7f7f7;
            color: #333;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
        }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-align: center;
            text-decoration: none;
            font-size: 16px;
            border-radius: 5px;
        }
        .footer {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your iNiNE account. If you didn't make this request, you can safely ignore this email.</p>
        <p>Otherwise, you can reset your password by clicking the button below:</p>
        <p><a href="${resetLink}" class="button">Reset Password</a></p>
        <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>Thank you,<br>The iNiNE Team</p>
    </div>
</body>
</html>
`
    );
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.log(
      "error",
      "error at forgetPassController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getResetPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const { token } = req.params;
    jwt.verify(token, process.env.JWT_SECRET as Secret);

    // If the token is valid, render the password reset form
    res.render("resetPassword", { token });
  } catch (error) {
    console.log(
      "error",
      "error at getResetPasswordController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    console.log(req.body, ">>>>>>>>>");

    const { password } = req.body;
    console.log(token, password, "???????????");
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as Secret);
    //@ts-ignore
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(400).send("Invalid token");
    }
    const passwordHash = jwt.sign(password, process.env.JWT_SECRET as Secret);
    user.password = passwordHash;
    await updateUser(new UserModel(user));
    res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    console.log(
      "error",
      "error at resetPasswordController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};
