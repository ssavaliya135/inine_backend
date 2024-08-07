import { Response } from "express";
import { Request } from "../../request";
import {
  getAllUser,
  getAllUserForNotification,
  getPopulatedUserById,
  getUserByName,
  getUserByPhoneNumber,
} from "../../services/user.service";
import Joi, { isError } from "joi";
import {
  getPortfolioByUserIdAndMonth,
  savePortfolio,
  updatePortfolio,
} from "../../services/portfolio.service";
import { PortfolioModel } from "../../models/portfolio.model";
import {
  calculateMonth,
  calculateROI,
  calculateTotalDays,
  overallPNL,
} from "../../helper/calculation";
import {
  getAmountByUserIdAndMonth,
  saveAmount,
  updateAmount,
} from "../../services/amount.service";
import { AmountModel } from "../../models/amount.model";
import moment from "moment";
import { sendNotification } from "../../helper/notification";

export const addPNLSchema = Joi.object({
  pnl: Joi.number().required(),
  tax: Joi.number().optional(),
  date: Joi.string().required(),
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
    if (payloadValue.tax) {
      payloadValue.pnl = payloadValue.pnl - payloadValue.tax;
    }
    let { month } = calculateMonth(payloadValue.date);
    let portfolio = await getPortfolioByUserIdAndMonth(userId, month);
    const itemDate = moment(payloadValue.date, "DD/MM/YYYY");
    const dayFullName = itemDate.format("dddd");
    console.log(itemDate, dayFullName, "::::::::");

    let portfolioObj = {
      ROI: calculateROI(portfolio.totalCapital, payloadValue.pnl),
      pnlValue: payloadValue.pnl,
      date: payloadValue.date,
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
    } = overallPNL(portfolio.pnlList);
    portfolio.totalPnlValue = totalPnlValue;
    portfolio.tax = payloadValue.tax;
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
    portfolio.currentMonthPNL = currentMonthPNL;
    portfolio.currentDD = DD;
    portfolio.MDD = MDD;
    portfolio.MDDRatio = (MDD / portfolio.totalCapital) * 100;
    portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
    portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;
    let pnlDays = portfolio.pnlList.length;
    portfolio.winRation = pnlDays ? (winDays / pnlDays) * 100 : 0;
    portfolio.lossRation = pnlDays ? (lossDays / pnlDays) * 100 : 0;
    portfolio.riskReward = portfolio.avgProfit / portfolio.avgLoss;
    console.log(
      portfolio.winRation,
      portfolio.avgProfit,
      portfolio.lossRation,
      portfolio.avgLoss,
      "???????"
    );

    portfolio.expectancy =
      portfolio.winRation * portfolio.avgProfit +
      portfolio.lossRation * portfolio.avgLoss;
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

    let { totalDays, month } = calculateTotalDays(payloadValue.date);
    payloadValue.userId = userId;
    payloadValue.month = month;

    // Determine if the amount is a deposit or a withdrawal
    const isDeposit = payloadValue.amount > 0;

    // Check if an entry for the user and month already exists
    let existingAmountEntry = await AmountModel.findOne({
      userId,
      month,
      paymentMode: payloadValue.paymentMode,
      amountType: isDeposit ? "deposit" : "withdrawal",
    });

    if (existingAmountEntry) {
      return res
        .status(500)
        .send({ message: "You already have a transaction" });
    } else {
      // Create a new entry
      payloadValue.amountType = isDeposit ? "deposit" : "withdrawal";
      await saveAmount(new AmountModel(payloadValue));
    }

    if (isDeposit) {
      // Save to the portfolio
      await savePortfolio(
        new PortfolioModel({
          userId: userId,
          totalCapital: payloadValue.amount,
          month,
          totalDays,
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

      const number = Math.ceil(fcmToken.length / 490);
      for (let i = 0; i < number; i++) {
        const chunk = fcmToken.slice(i * 490, (i + 1) * 490);

        const notificationObj = {
          tokens: chunk,
          notification: {
            title: "hello world",
            body: "what is your name",
          },
          data: {
            type: "notificationType",
          },
        };

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
