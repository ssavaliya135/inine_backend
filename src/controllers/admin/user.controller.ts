import { Response } from "express";
import Joi, { isError } from "joi";
import moment from "moment";
import {
  calculateMonth,
  calculateROI,
  calculateTotalDays,
  overallPNL,
} from "../../helper/calculation";
import { sendNotification } from "../../helper/notification";
import { AmountModel } from "../../models/amount.model";
import { IPortfolio, PortfolioModel } from "../../models/portfolio.model";
import { Request } from "../../request";
import { saveAmount } from "../../services/amount.service";
import {
  getLastPortfolioByUserId,
  getPortfolioById,
  getPortfolioByUserIdAndMonth,
  savePortfolio,
  updatePortfolio,
} from "../../services/portfolio.service";
import {
  getAllUser,
  getAllUserForNotification,
  getLeaderUser,
  getPopulatedUserById,
  getUserById,
  getUserByName,
  getUserByPhoneNumber,
  updateUser,
} from "../../services/user.service";
import { UserModel } from "../../models/user.model";
import mongoose from "mongoose";

export const addPNLSchema = Joi.object({
  pnl: Joi.number().required(),
  tax: Joi.number().optional(),
  date: Joi.string().required(),
  index: Joi.array().required(),
});

export const addReferralSchema = Joi.object({
  userId: Joi.string()
    .required()
    .external(async (v) => {
      let user;
      if (v) {
        user = await getUserById(v);
        if (!user) {
          throw new Joi.ValidationError(
            "user not found",
            [
              {
                message: "user not found",
                path: ["userId"],
                type: "any.custom",
              },
            ],
            v
          );
        }
      }
      return user;
    }),
});

export const updatePNLSchema = Joi.object({
  profileId: Joi.string()
    .required()
    .external(async (v: string) => {
      const portfolio: IPortfolio = await getPortfolioById(v);
      if (!portfolio) {
        throw new Joi.ValidationError(
          "please provide valid portfolioId",
          [
            {
              message: "please provide valid portfolioId",
              path: ["profileId"],
              type: "any.custom",
            },
          ],
          v
        );
      }
      return v;
    }),
  pnlList: Joi.array().required(),
});

export const depositAmountSchema = Joi.object().keys({
  amount: Joi.number().optional(),
  paymentMode: Joi.string().optional().allow(""),
  date: Joi.string().required(),
});

export const getAllUserAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    const userId = req.params.id;
    if (userId) {
      const populatedUser = await getPopulatedUserById(userId);
      return res.status(200).json(populatedUser);
    } else {
      const allPopulatedUser = await getAllUser();
      return res.status(200).json(allPopulatedUser);
    }
  } catch (error) {
    console.log("error", "error in getAllUser", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};

export const searchUserAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    const phnNumber = req.params.phnNumber;
    if (!phnNumber) {
      return res.status(403).json("invalid number");
    }
    const populatedUser = await getUserByPhoneNumber(phnNumber);
    return res.status(200).json(populatedUser);
  } catch (error) {
    console.log("error", "error in searchUserAdminController", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};

export const searchUserByNameAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    const firstName = req.params.firstName;
    if (!firstName) {
      return res.status(403).json("invalid firstName");
    }
    const populatedUser = await getUserByName(firstName);
    return res.status(200).json(populatedUser);
  } catch (error) {
    console.log("error", "error in searchUserByNameAdminController", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};

export const addPNLAdminController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    const userId = req.params.userId;
    if (!userId) {
      return res.status(403).json({
        message: "please provide valid userID",
      });
    }
    const populatedUser = await getPopulatedUserById(userId);
    if (!populatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }
    const payloadValue = await addPNLSchema
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
    // console.log(await calculateTotalDays(payloadValue.date));

    // return;
    let { month } = calculateMonth(payloadValue.date);
    let portfolio = await getPortfolioByUserIdAndMonth(userId, month);
    if (!portfolio) {
      return res.status(410).json({ message: "You have to add deposit first" });
    }
    payloadValue.date = moment(payloadValue.date).format("DD/MM/YYYY");
    let pnl = portfolio.pnlList.filter((ele) => ele.date == payloadValue.date);
    if (pnl.length > 0) {
      return res
        .status(409)
        .json({ messsage: "this date pnl is already in the portfolio" });
    }
    let latestMDD = portfolio.MDD;
    const itemDate = moment(payloadValue.date, "DD/MM/YYYY");
    const dayFullName = itemDate.format("dddd");
    let portfolioObj = {
      ROI: calculateROI(portfolio.totalCapital, payloadValue.pnl),
      pnlValue: payloadValue.pnl,
      cumulativePNL: portfolio.totalPnlValue + payloadValue.pnl,
      date: payloadValue.date,
      index: payloadValue.index,
      day: dayFullName,
    };
    portfolio.pnlList.push(portfolioObj);
    let {
      totalPnlValue,
      totalROI,
      winDays,
      lossDays,
      totalWinProfit,
      totalLoss,
      maxProfit,
      maxLoss,
      maxWinStreak,
      maxLossStreak,
      latestProfit,
      latestLoss,
      todayPNL,
      currentWeekPNL,
      currentMonthPNL,
      maxLatestProfit,
      MDD,
      DD,
    } = overallPNL(
      portfolio.pnlList,
      portfolio.lastFridayPreviousMonth,
      portfolio.lastThursdayCurrentMonth,
      latestMDD
    );

    portfolio.totalPnlValue = totalPnlValue;
    portfolio.tax = portfolio.tax + payloadValue.tax;
    portfolio.totalROI = totalROI;
    portfolio.winDays = winDays;
    portfolio.lossDays = lossDays;
    portfolio.totalWinProfit = totalWinProfit;
    portfolio.totalLoss = totalLoss;
    portfolio.maxProfit = maxProfit;
    portfolio.maxLoss = maxLoss;
    portfolio.maxWinStreak = maxWinStreak;
    portfolio.maxLossStreak = maxLossStreak;
    portfolio.todayPNL = todayPNL;
    portfolio.currentWeekPNL = currentWeekPNL;
    if (payloadValue.tax) {
      portfolio.currentMonthPNL = currentMonthPNL - payloadValue.tax;
    } else {
      portfolio.currentMonthPNL = currentMonthPNL;
    }
    // portfolio.currentMonthPNL = currentMonthPNL;
    portfolio.currentDD = DD == 0 ? DD : DD;
    portfolio.MDD = DD == 0 ? MDD : MDD;
    let MDDRatio = (MDD / portfolio.totalCapital) * 100;
    portfolio.MDDRatio = MDDRatio == 0 ? MDDRatio : -MDDRatio;
    portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
    portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;
    let pnlDays = portfolio.pnlList.length;
    portfolio.winRation = pnlDays ? (winDays / pnlDays) * 100 : 0;
    portfolio.lossRation = pnlDays ? (lossDays / pnlDays) * 100 : 0;
    let riskReward = portfolio.avgProfit / portfolio.avgLoss;
    portfolio.riskReward = riskReward == null ? 0 : -riskReward;
    portfolio.expectancy =
      (portfolio.winRation * portfolio.avgProfit) /
      (portfolio.lossRation * portfolio.avgLoss);
    portfolio.expectancy = portfolio.expectancy;
    let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
    res.status(200).json(updatedPortfolio);
  } catch (error) {
    console.log("error", "error in addPNLAdminController", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};

export const updatePNLAdminController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    console.log(req.body, "^^^^^^^^^^^^^^^^^^^^");

    const payloadValue = await updatePNLSchema
      .validateAsync(req.body)
      .then((value) => value)
      .catch((e) => {
        console.log(e);
        res.status(422).json({ message: e.message });
        return null;
      });

    if (!payloadValue) {
      return;
    }
    console.log(payloadValue, "??????????????");

    let portfolio = await getPortfolioById(payloadValue.profileId);
    if (!portfolio) {
      return res.status(410).json({ message: "You have to add deposit first" });
    }
    portfolio.pnlList = [];
    for (const pnlItem of payloadValue.pnlList) {
      // pnlItem.date = moment(pnlItem.date).format("DD/MM/YYYY");
      pnlItem.date = moment(pnlItem.date, "DD/MM/YYYY").format("DD/MM/YYYY");
      let existingPnl = portfolio.pnlList.find(
        (ele) => ele.date === pnlItem.date
      );
      if (existingPnl) {
        return res.status(409).json({
          message: `PNL for date ${pnlItem.date} already exists in the portfolio`,
        });
      }
      console.log(pnlItem.date, ">>>>>>>>>>>");

      const itemDate = moment(pnlItem.date, "DD/MM/YYYY");
      console.log(itemDate, "????????????");
      const dayFullName = itemDate.format("dddd");

      let portfolioObj = {
        ROI: calculateROI(portfolio.totalCapital, pnlItem.pnl),
        pnlValue: pnlItem.pnl,
        cumulativePNL: portfolio.totalPnlValue + pnlItem.pnl,
        date: pnlItem.date,
        index: pnlItem.index,
        day: dayFullName,
      };

      portfolio.pnlList.push(portfolioObj);
      portfolio.totalPnlValue += pnlItem.pnl;
      portfolio.tax += pnlItem.tax || 0;

      let {
        totalPnlValue,
        totalROI,
        winDays,
        lossDays,
        totalWinProfit,
        totalLoss,
        maxProfit,
        maxLoss,
        maxWinStreak,
        maxLossStreak,
        latestProfit,
        latestLoss,
        todayPNL,
        currentWeekPNL,
        currentMonthPNL,
        maxLatestProfit,
        MDD,
        DD,
      } = overallPNL(
        portfolio.pnlList,
        portfolio.lastFridayPreviousMonth,
        portfolio.lastThursdayCurrentMonth,
        portfolio.MDD
      );

      // Update portfolio with calculated values
      Object.assign(portfolio, {
        totalPnlValue,
        totalROI,
        winDays,
        lossDays,
        totalWinProfit,
        totalLoss,
        maxProfit,
        maxLoss,
        maxWinStreak,
        maxLossStreak,
        todayPNL,
        currentWeekPNL,
        currentMonthPNL: currentMonthPNL - (pnlItem.tax || 0),
        currentDD: DD,
        MDD,
      });

      portfolio.MDDRatio = (MDD / portfolio.totalCapital) * -100;
      portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
      portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;

      const pnlDays = portfolio.pnlList.length;
      portfolio.winRation = pnlDays ? (winDays / pnlDays) * 100 : 0;
      portfolio.lossRation = pnlDays ? (lossDays / pnlDays) * 100 : 0;

      const riskReward = -portfolio.avgProfit / portfolio.avgLoss;
      portfolio.riskReward = isFinite(riskReward) ? riskReward : 0;

      portfolio.expectancy =
        (portfolio.winRation * portfolio.avgProfit) /
        (portfolio.lossRation * portfolio.avgLoss);
      portfolio.expectancy = isFinite(portfolio.expectancy)
        ? portfolio.expectancy
        : 0;
    }

    let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
    res.status(200).json(updatedPortfolio);
  } catch (error) {
    console.log("error", "error in updatePNLAdminController", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};

export const amountAdminController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }

    let userId = req.params.userId;
    if (!userId) {
      return res.status(403).send({ message: "Invalid userId provided" });
    }

    const payloadValue = await depositAmountSchema
      .validateAsync(req.body)
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

    let {
      totalDays,
      month,
      lastFridayPreviousMonth,
      lastThursdayCurrentMonth,
    } = calculateTotalDays(payloadValue.date);
    payloadValue.userId = userId;
    payloadValue.month = month;

    // Determine if the amount is a deposit or a withdrawal
    const isDeposit = payloadValue.amount > 0;
    let existingAmountEntry;
    console.log(isDeposit, "***********");
    existingAmountEntry = await AmountModel.findOne({
      userId,
      month,
      // paymentMode: payloadValue.paymentMode,
      amountType: isDeposit ? "deposit" : "withdrawal",
    });

    if (existingAmountEntry) {
      return res.status(401).send({
        message: "A transaction (deposit or withdrawal) has already been made.",
      });
    } else if (!isDeposit) {
      existingAmountEntry = await AmountModel.findOne({
        userId,
        month,
        paymentMode: payloadValue.paymentMode,
        amountType: "deposit",
      });

      if (!existingAmountEntry) {
        console.log(existingAmountEntry, "&&&&&");
        return res.status(400).send({ message: "You have to deposit first" });
      } else {
        // Create a new entry
        payloadValue.amountType = isDeposit ? "deposit" : "withdrawal";
        await saveAmount(new AmountModel(payloadValue));
      }
    } else {
      // Create a new entry
      payloadValue.amountType = isDeposit ? "deposit" : "withdrawal";
      await saveAmount(new AmountModel(payloadValue));
    }
    // else {
    //   // Check if an entry for the user and month already exists
    //   existingAmountEntry = await AmountModel.findOne({
    //     userId,
    //     month,
    //     paymentMode: payloadValue.paymentMode,
    //     amountType: isDeposit ? "deposit" : "withdrawal",
    //   });

    //   if (existingAmountEntry) {
    //     return res
    //       .status(500)
    //       .send({ message: "You already have a transaction" });
    //   } else {
    //     // Create a new entry
    //     payloadValue.amountType = isDeposit ? "deposit" : "withdrawal";
    //     await saveAmount(new AmountModel(payloadValue));
    //   }
    // }

    if (isDeposit) {
      // Save to the portfolio
      await savePortfolio(
        new PortfolioModel({
          userId: userId,
          totalCapital: payloadValue.amount,
          month,
          totalDays,
          lastFridayPreviousMonth: moment(
            lastFridayPreviousMonth
          ).toISOString(),
          lastThursdayCurrentMonth: moment(
            lastThursdayCurrentMonth
          ).toISOString(),
        })
      );
    }

    return res.status(200).json({ message: "Amount processed successfully" });
  } catch (error) {
    console.log(
      "error",
      "error at amountAdminController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const sendNotificationController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let body = req.body.body;
    let notificationTitle = req.body.notificationTitle;
    const CHUNK_SIZE = 500;
    const fetchUsersInChunks = async (offset, chunkSize) => {
      const users = await getAllUserForNotification(offset, chunkSize);
      return users;
    };
    let offset = 0;
    let fetchMoreUsers = true;

    while (fetchMoreUsers) {
      const users = await fetchUsersInChunks(offset, CHUNK_SIZE);
      if (users.length === 0) {
        fetchMoreUsers = false;
        break;
      }
      let fcmToken = [];
      users.forEach((user) => {
        if (user.FCMToken?.length > 0) {
          fcmToken.push(...user.FCMToken);
        }
      });
      let title = [
        "Daily Market Update 📈",
        "Today's Trading Insights 💹",
        "Market Snapshot: Today's Highlights 🔍",
        "Your Daily Trade Analysis 📊",
        "Key Market Movements Today 🔺",
        "Today’s Financial Insights 💡",
        "Daily Market Trends & Analysis 📈📉",
        "Today's Investment Highlights 💰",
        "Market News You Need to Know 📰",
        "Daily Trading Overview 📋",
      ];
      const number = Math.ceil(fcmToken.length / 490);
      for (let i = 0; i < number; i++) {
        const chunk = fcmToken.slice(i * 490, (i + 1) * 490);

        const notificationObj = {
          tokens: [...new Set(chunk)],
          notification: {
            title: notificationTitle,
            body: body ? body : "",
          },
          data: {
            // title: notificationTitle,
            // title: title[Math.floor(Math.random() * title.length + 1)],
            // body: body ? body : "",
            type: "notificationType",
          },
        };
        //  let notificationObj = {
        //    tokens: [payloadValue.pushToken],
        //    notification: {
        //      title: "Dalle - create art with api",
        //      body: "🎉 Welcome to Dalle! It's the perfect time to unleash your creativity and bring your ideas to life with text-to-image creation. Start exploring now!",
        //    },
        //    data: {
        //      type: "google Sign-up notification",
        //    },
        //  };
        console.log("::::::", notificationObj, ":::::::::::");

        await sendNotification(notificationObj);
      }

      offset += CHUNK_SIZE;
    }
    res.status(200).json("successfull");
  } catch (error) {
    console.log(
      "error",
      "error at sendNotificationController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const addReferralController = async (req: Request, res: Response) => {
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
    const payloadValue = await addReferralSchema
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
    payloadValue.userId.referredBy = new mongoose.Types.ObjectId(user._id);
    await updateUser(new UserModel(payloadValue.userId));
    user.referrals.push(new mongoose.Types.ObjectId(payloadValue.userId));
    await updateUser(new UserModel(user));
    res.status(200).json("successfull");
  } catch (error) {
    console.log(
      "error",
      "error at addReferralController#################### ",
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

export const getLastPortfolioController = async (
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
      return res.status(403).json("unauthorized request");
    }
    let user = await getUserById(userId);
    if (!user) {
      return res.status(403).json("user not found");
    }

    let portfolio = await getLastPortfolioByUserId(user._id);
    if (portfolio.length == 0) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    // portfolio[0].pnlList = portfolio[0].pnlList.reverse();
    return res.status(200).json(portfolio[0]);
  } catch (error) {
    console.log(
      "error",
      "error at getLastPortfolioController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const addLeaderUserController = async (req: Request, res: Response) => {
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

    user.isLeader = true;
    await updateUser(new UserModel(user));
    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(
      "error",
      "error at addLeaderUserController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getLeaderUserController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let users = await getLeaderUser();
    return res.status(200).json(users);
  } catch (error) {
    console.log(
      "error",
      "error at getLeaderUserController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};
