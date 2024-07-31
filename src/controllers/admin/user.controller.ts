import { Response } from "express";
import { Request } from "../../request";
import { getAllUser, getPopulatedUserById } from "../../services/user.service";
import Joi from "joi";
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
import { updateAmount } from "../../services/amount.service";

export const addPNLSchema = Joi.object({
  pnl: Joi.number().required(),
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
    let { month } = calculateTotalDays();
    let portfolio = await getPortfolioByUserIdAndMonth(userId, month);
    let portfolioObj = {
      ROI: calculateROI(portfolio.totalCapital, payloadValue.pnl),
      pnlValue: payloadValue.pnl,
      date: payloadValue.date,
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
    } = overallPNL(portfolio.pnlList);
    portfolio.totalPnlValue = totalPnlValue;
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
    portfolio.currentDD = latestLoss - latestProfit;
    let MDD = maxLoss - maxProfit;
    portfolio.MDD = MDD;
    portfolio.MDDRatio = (MDD / portfolio.totalCapital) * 100;
    portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
    portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;
    portfolio.winRation = portfolio.totalDays
      ? (winDays / portfolio.totalDays) * 100
      : 0;
    portfolio.lossRation = portfolio.totalDays
      ? (lossDays / portfolio.totalDays) * 100
      : 0;
    let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
    res.status(200).json(updatedPortfolio);
  } catch (error) {
    console.log("error", "error in getAllUser", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};
