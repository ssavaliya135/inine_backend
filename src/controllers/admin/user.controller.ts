import { getPortfolioByUserIdAndMonth1 } from "./../../services/portfolio.service";
import { Response } from "express";
import Joi, { isError } from "joi";
import moment from "moment";
import {
  calculateMonth,
  calculateROI,
  calculateTotalDays,
  overallPNL,
  overallPNL1,
} from "../../helper/calculation";
import { sendNotification } from "../../helper/notification";
import { AmountModel } from "../../models/amount.model";
import { IPortfolio, PortfolioModel } from "../../models/portfolio.model";
import { IUser, UserModel } from "../../models/user.model";
import { WatchListModel } from "../../models/watchList.model";
import { Request } from "../../request";
import {
  deleteAmount,
  getAmountByUserIdAndMonth,
  saveAmount,
  updateAmount,
} from "../../services/amount.service";
import {
  deletePortfolio,
  getLastPortfolioByUserId,
  getPortfolioById,
  getPortfolioByUserId,
  getPortfolioByUserIdAndMonth,
  savePortfolio,
  updatePortfolio,
} from "../../services/portfolio.service";
import {
  findUser,
  getAllUser,
  getAllUserForNotification,
  getLeaderUser,
  getNormalUser,
  getPopulatedUserById,
  getUserById,
  getUserByName,
  getUserByPhoneNumber,
  updateUser,
} from "../../services/user.service";
import {
  deleteWatchList,
  getWatchListById,
  getWatchListByLeaderId,
  saveWatchList,
} from "../../services/watchList.service";
import { Types } from "mongoose";

export const updateUserSchema = Joi.object({
  firstName: Joi.string().required(),
  userId: Joi.string()
    .required()
    .external(async (v) => {
      let user = await getUserById(v);
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
      return user;
    }),
});

export const addPNLSchema = Joi.object({
  pnl: Joi.number().required(),
  tax: Joi.number().optional(),
  date: Joi.string().required(),
  index: Joi.array().required(),
});

export const addGroupPNLSchema = Joi.object({
  pnl: Joi.number().required(),
  tax: Joi.number().optional(),
  date: Joi.string().required(),
  index: Joi.array().required(),
  groupMembers: Joi.array().required(),
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

export const addWatchListSchema = Joi.object({
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

export const hideUnhideUserSchema = Joi.object({
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
  isHide: Joi.boolean().required(),
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
  tax: Joi.number().required(),
});

export const editAmountSchema = Joi.object().keys({
  amount: Joi.number().optional(),
  paymentMode: Joi.string().optional().allow(""),
  // profileId: Joi.string()
  //   .required()
  //   .external(async (v: string) => {
  //     const portfolio: IPortfolio = await getPortfolioById(v);
  //     if (!portfolio) {
  //       throw new Joi.ValidationError(
  //         "please provide valid portfolioId",
  //         [
  //           {
  //             message: "please provide valid portfolioId",
  //             path: ["profileId"],
  //             type: "any.custom",
  //           },
  //         ],
  //         v
  //       );
  //     }
  //     return v;
  //   }),
  month: Joi.string().required(),
});

export const depositAmountSchema = Joi.object().keys({
  amount: Joi.number().optional(),
  paymentMode: Joi.string().optional().allow(""),
  date: Joi.string().required(),
});
export const notificationSchema = Joi.object().keys({
  body: Joi.string().required(),
  notificationTitle: Joi.string().required(),
  groupId: Joi.string()
    .optional()
    .external(async (v) => {
      let group;
      if (v) {
        let group = await findUser({ _id: v });
        if (!group) {
          throw new Joi.ValidationError(
            "GroupLeader not found",
            [
              {
                message: "Group not found",
                path: ["groupId"],
                type: "any.custom",
              },
            ],
            v
          );
        }
      }
      return group;
    }),
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
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let userList = [];
    if (userId) {
      const populatedUser = await getPopulatedUserById(userId);
      return res.status(200).json(populatedUser);
    } else {
      let { month } = calculateMonth(new Date());
      const allPopulatedUser = await getAllUser(false, page, limit);
      for await (let user of allPopulatedUser) {
        const userObj = user.toObject() as IUser & {
          totalInvestment: number;
          month: string;
        };
        let investmentData = await getAmountByUserIdAndMonth(user._id, month);
        userObj.totalInvestment = investmentData ? investmentData.amount : 0;
        userObj.month = investmentData ? investmentData.month : "";
        userList.push(userObj);
      }
      return res.status(200).json(userList);
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

export const updateUserAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    const payloadValue = await updateUserSchema
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
    payloadValue.userId.firstName = payloadValue.firstName;
    console.log(payloadValue.userId, "???????????????");

    await updateUser(new UserModel(payloadValue.userId));
    return res.status(200).json({ message: "user updated" });
  } catch (error) {
    console.log("error", "error in updateUserAdminController", error);
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

export const addGroupPNLAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    const userId = req.params.groupId;
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
    const payloadValue = await addGroupPNLSchema
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

    let { month } = calculateMonth(payloadValue.date);
    payloadValue.date = moment(payloadValue.date).format("DD/MM/YYYY");
    let portfolio = await getPortfolioByUserIdAndMonth(userId, month);
    if (!portfolio) {
      return res.status(410).json({ message: "You have to add deposit first" });
    }
    let totalCapitalForTax = portfolio.totalCapital;

    let data = await calculatePNL(
      payloadValue,
      portfolio,
      portfolio.totalCapital,
      totalCapitalForTax
    );

    // let portfolio = await getPortfolioByUserIdAndMonth(userId, month);
    // if (!portfolio) {
    //   return res.status(410).json({ message: "You have to add deposit first" });
    // }
    // let pnl = portfolio.pnlList.filter((ele) => ele.date == payloadValue.date);
    // if (pnl.length > 0) {
    //   return res
    //     .status(409)
    //     .json({ messsage: "this date pnl is already in the portfolio" });
    // }
    // let latestMDD = portfolio.MDD;
    // const itemDate = moment(payloadValue.date, "DD/MM/YYYY");
    // const dayFullName = itemDate.format("dddd");
    // let portfolioObj = {
    //   ROI: calculateROI(portfolio.totalCapital, payloadValue.pnl),
    //   pnlValue: payloadValue.pnl,
    //   cumulativePNL: portfolio.totalPnlValue + payloadValue.pnl,
    //   date: payloadValue.date,
    //   index: payloadValue.index,
    //   day: dayFullName,
    // };
    // portfolio.pnlList.push(portfolioObj);
    // let {
    //   totalPnlValue,
    //   totalROI,
    //   winDays,
    //   lossDays,
    //   totalWinProfit,
    //   totalLoss,
    //   maxProfit,
    //   maxLoss,
    //   maxWinStreak,
    //   maxLossStreak,
    //   latestProfit,
    //   latestLoss,
    //   todayPNL,
    //   currentWeekPNL,
    //   currentMonthPNL,
    //   maxLatestProfit,
    //   MDD,
    //   DD,
    // } = overallPNL(
    //   portfolio.pnlList,
    //   portfolio.lastFridayPreviousMonth,
    //   portfolio.lastThursdayCurrentMonth,
    //   latestMDD
    // );

    // portfolio.totalPnlValue = totalPnlValue;
    // portfolio.tax = portfolio.tax + payloadValue.tax;
    // portfolio.totalROI = totalROI;
    // portfolio.winDays = winDays;
    // portfolio.lossDays = lossDays;
    // portfolio.totalWinProfit = totalWinProfit;
    // portfolio.totalLoss = totalLoss;
    // portfolio.maxProfit = maxProfit;
    // portfolio.maxLoss = maxLoss;
    // portfolio.maxWinStreak = maxWinStreak;
    // portfolio.maxLossStreak = maxLossStreak;
    // portfolio.todayPNL = todayPNL;
    // portfolio.currentWeekPNL = currentWeekPNL;
    // if (payloadValue.tax) {
    //   portfolio.currentMonthPNL = currentMonthPNL - payloadValue.tax;
    // } else {
    //   portfolio.currentMonthPNL = currentMonthPNL;
    // }
    // // portfolio.currentMonthPNL = currentMonthPNL;
    // portfolio.currentDD = DD == 0 ? DD : DD;
    // portfolio.MDD = DD == 0 ? MDD : MDD;
    // let MDDRatio = (MDD / portfolio.totalCapital) * 100;
    // portfolio.MDDRatio = MDDRatio == 0 ? MDDRatio : -MDDRatio;
    // portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
    // portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;
    // let pnlDays = portfolio.pnlList.length;
    // portfolio.winRation = pnlDays ? (winDays / pnlDays) * 100 : 0;
    // portfolio.lossRation = pnlDays ? (lossDays / pnlDays) * 100 : 0;
    // let riskReward = portfolio.avgProfit / portfolio.avgLoss;
    // portfolio.riskReward = riskReward == null ? 0 : -riskReward;
    // portfolio.expectancy =
    //   (portfolio.winRation * portfolio.avgProfit) /
    //   (portfolio.lossRation * portfolio.avgLoss);
    // portfolio.expectancy = portfolio.expectancy;
    // let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
    console.log(populatedUser, "/////////");

    let hideUser = populatedUser.groupMembers.filter((m) => {
      console.log(m, ">>>>>>>>>>>>>>>>>>>>>");

      console.log(m._id);
      console.log(payloadValue.groupMembers.includes(m._id.toString()));
      console.log(!payloadValue.groupMembers.includes(m._id.toString()));

      if (!payloadValue.groupMembers.includes(m._id.toString())) {
        return m;
      }
    });

    console.log(hideUser, ">>>>>>>>>>>>.");
    for await (let ele of hideUser) {
      // hideUser.forEach(async (ele) => {
      let amount = await getAmountByUserIdAndMonth(ele.toString(), month);
      console.log(amount, ":::::::::::::::::::");

      portfolio.totalCapital = portfolio.totalCapital - amount?.amount;
      if (payloadValue.tax) {
        let hideUserPortfolio = await getPortfolioByUserIdAndMonth(
          ele.toString(),
          month
        );
        let percentage =
          (hideUserPortfolio.totalCapital * 100) / totalCapitalForTax;
        console.log(hideUserPortfolio.totalCapital, ">>>>>>");
        console.log(totalCapitalForTax, "heyyyyyyyyyyyyy");

        console.log(percentage, "??????????/");

        hideUserPortfolio.tax = (percentage * payloadValue.tax) / 100;
        console.log(
          hideUserPortfolio.tax,
          "helloooooooooooooooooooooooooooooooooooooooooooooooooooooo"
        );

        await updatePortfolio(new PortfolioModel(hideUserPortfolio));
      }
      // let user = await getUserById(ele.toString());
      // user.isHide = true;
      // await updateUser(user);
    }
    // });
    console.log(portfolio.totalCapital, "###########");
    console.log(payloadValue.groupMembers, "++++++++++++++++");

    for (let user of payloadValue.groupMembers) {
      let userPortfolio = await getPortfolioByUserIdAndMonth(
        user.toString(),
        month
      );
      if (!userPortfolio) {
        return res
          .status(410)
          .json({ message: "You have to add deposit first" });
      }
      data = await calculatePNL(
        payloadValue,
        userPortfolio,
        portfolio.totalCapital,
        totalCapitalForTax
      );
    }
    res.status(data.status).json(data.data);
  } catch (error) {
    console.log("error", "error in addGroupPNLAdminController", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};

const calculatePNL = async (
  payloadValue,
  portfolio,
  totalCapital,
  totalCapitalForTax
) => {
  let pnl = portfolio.pnlList.filter((ele) => ele.date == payloadValue.date);
  if (pnl.length > 0) {
    return {
      status: 409,
      data: { message: "this date pnl is already in the portfolio" },
    };
  }
  let latestMDD = portfolio.MDD;
  const itemDate = moment(payloadValue.date, "DD/MM/YYYY");
  const dayFullName = itemDate.format("dddd");
  let percentage = (portfolio.totalCapital * 100) / totalCapital;

  console.log(percentage, "hoolllllllllllllllllllllaaaaaaaaaaaaaaaa");

  let pnlValue = (percentage * payloadValue.pnl) / 100;
  let portfolioObj = {
    ROI: calculateROI(portfolio.totalCapital, pnlValue),
    pnlValue: pnlValue,
    cumulativePNL: portfolio.totalPnlValue + pnlValue,
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
  let taxPercentage;
  if (payloadValue.tax) {
    taxPercentage = (portfolio.totalCapital * 100) / totalCapitalForTax;
  }
  portfolio.tax = (taxPercentage * payloadValue.tax) / 100;
  // portfolio.tax = portfolio.tax + (percentage * payloadValue.tax) / 100;
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
    portfolio.currentMonthPNL =
      currentMonthPNL - (percentage * payloadValue.tax) / 100;
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
  return { status: 200, data: updatedPortfolio };
};

export const updatePNLAdminController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
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
    portfolio.tax = 0;
    portfolio.totalPnlValue = 0;
    portfolio.totalROI = 0;
    portfolio.winDays = 0;
    portfolio.winRation = 0;
    portfolio.avgProfit = 0;
    portfolio.totalWinProfit = 0;
    portfolio.maxProfit = 0;
    portfolio.todayPNL = 0;
    portfolio.currentWeekPNL = 0;
    portfolio.currentMonthPNL = 0;
    portfolio.currentDD = 0;
    portfolio.lossDays = 0;
    portfolio.lossRation = 0;
    portfolio.avgLoss = 0;
    portfolio.totalLoss = 0;
    portfolio.maxLoss = 0;
    portfolio.maxWinStreak = 0;
    portfolio.maxLossStreak = 0;
    portfolio.MDD = 0;
    portfolio.MDDRatio = 0;
    portfolio.riskReward = 0;
    portfolio.expectancy = 0;
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
        ROI: calculateROI(portfolio.totalCapital, Number(pnlItem.pnl)),
        pnlValue: Number(pnlItem.pnl),
        cumulativePNL: portfolio.totalPnlValue + Number(pnlItem.pnl),
        date: pnlItem.date,
        index: pnlItem.index,
        day: dayFullName,
      };

      portfolio.pnlList.push(portfolioObj);
      portfolio.totalPnlValue += Number(pnlItem.pnl);
      portfolio.tax += Number(pnlItem.tax) || 0;

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
        currentMonthPNL: currentMonthPNL - (Number(pnlItem.tax) || 0),
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
    portfolio.tax = payloadValue.tax;
    portfolio.currentMonthPNL = portfolio.totalPnlValue - portfolio.tax;
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

export const updatePNLCalculation1 = async (
  payloadValue,
  portfolio,
  totalCapital,
  oldPnlList,
  groupMembers = []
) => {
  console.log(payloadValue.pnlList, "Processing PnL");
  console.log(portfolio.totalCapital, totalCapital, "#########");

  let percentage;
  // let percentage = (portfolio.totalCapital * 100) / totalCapital;
  const currentDate = moment().format("DD/MM/YYYY");

  let pnlList = [...portfolio.pnlList];

  portfolio.totalPnlValue = 0;

  for (const pnlItem of payloadValue.pnlList) {
    const formattedPnlDate = moment(pnlItem.date, "DD/MM/YYYY").format(
      "DD/MM/YYYY"
    );

    // Find all users who have invested on this date
    let todaysTotalCapital = 0;
    for (let user of groupMembers) {
      const userPortfolio = await getPortfolioByUserIdAndMonth(
        user._id.toString(),
        portfolio.month
      );

      if (!userPortfolio) continue;

      // Only include users who have entry for this date
      const hasEntry = userPortfolio.pnlList.some(
        (item) => item.date === formattedPnlDate
      );

      if (hasEntry) {
        todaysTotalCapital += userPortfolio.totalCapital;
      }
    }
    let originalPnlValue = payloadValue.groupPnlList.find(
      (ele) =>
        moment(ele.date, "DD/MM/YYYY").format("DD/MM/YYYY") === formattedPnlDate
    );

    if (!originalPnlValue) {
      console.error(`Missing group PNL data for date: ${formattedPnlDate}`);
      continue;
    }

    // Calculate user's today's percentage
    let percentageToday = (portfolio.totalCapital * 100) / todaysTotalCapital;
    percentage = percentageToday;
    let pnlValue = (percentageToday * originalPnlValue.pnlValue) / 100;

    // const formattedPnlDate = moment(pnlItem.date, "DD/MM/YYYY").format(
    //   "DD/MM/YYYY"
    // );

    console.log(originalPnlValue.pnlValue, "*******************");
    console.log(percentage, ":::::::::");

    // let pnlValue = (percentage * originalPnlValue.pnlValue) / 100;
    console.log(pnlValue, "?????????????????????");

    let existingPnlIndex = pnlList.findIndex(
      (item) => item.date === formattedPnlDate
    );

    const dayFullName = moment(formattedPnlDate, "DD/MM/YYYY").format("dddd");

    if (existingPnlIndex !== -1) {
      pnlList[existingPnlIndex] = {
        ...pnlList[existingPnlIndex],
        ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
        pnlValue: Number(pnlValue),
        day: dayFullName,
        index: pnlItem.index || pnlList[existingPnlIndex].index,
      };
      console.log(`Updated existing PNL for ${formattedPnlDate}`);
    } else {
      let portfolioObj = {
        ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
        pnlValue: Number(pnlValue),
        cumulativePNL: 0,
        date: formattedPnlDate,
        index: pnlItem.index,
        day: dayFullName,
      };
      pnlList.push(portfolioObj);
      console.log(`Added new PNL for ${formattedPnlDate}`);
    }

    portfolio.totalPnlValue += Number(pnlValue);
  }

  pnlList.sort((a, b) =>
    moment(a.date, "DD/MM/YYYY").diff(moment(b.date, "DD/MM/YYYY"))
  );

  let runningTotal = 0;
  for (let i = 0; i < pnlList.length; i++) {
    runningTotal += Number(pnlList[i].pnlValue);
    pnlList[i].cumulativePNL = runningTotal;
  }

  portfolio.pnlList = pnlList;

  if (pnlList.length > 0) {
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
      todayPNL,
      currentWeekPNL,
      currentMonthPNL,
      MDD,
      DD,
    } = overallPNL(
      pnlList,
      portfolio.lastFridayPreviousMonth,
      portfolio.lastThursdayCurrentMonth,
      portfolio.MDD
    );

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
      currentMonthPNL:
        currentMonthPNL - ((percentage * Number(payloadValue.tax)) / 100 || 0),
      currentDD: DD,
      MDD,
    });

    portfolio.MDDRatio = (MDD / portfolio.totalCapital) * -100;
    portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
    portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;

    const pnlDays = pnlList.length;
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

  portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
  portfolio.currentMonthPNL =
    portfolio.totalPnlValue - (percentage * Number(payloadValue.tax)) / 100 ||
    0;

  let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
  return { status: 200, data: updatedPortfolio };
};

export const updatePNLCalculation11 = async (
  payloadValue,
  portfolio,
  totalCapital,
  oldPnlList
) => {
  console.log(payloadValue.pnlList, "Processing PnL");

  let percentage = (portfolio.totalCapital * 100) / totalCapital;
  const currentDate = moment().format("DD/MM/YYYY");

  let pnlList = [...portfolio.pnlList];

  portfolio.totalPnlValue = 0;

  for (const pnlItem of payloadValue.pnlList) {
    const formattedPnlDate = moment(pnlItem.date, "DD/MM/YYYY").format(
      "DD/MM/YYYY"
    );

    let originalPnlValue = payloadValue.groupPnlList.find(
      (ele) =>
        moment(ele.date, "DD/MM/YYYY").format("DD/MM/YYYY") === formattedPnlDate
    );

    if (!originalPnlValue) {
      console.error(`Missing group PNL data for date: ${formattedPnlDate}`);
      continue;
    }

    let pnlValue = (percentage * originalPnlValue.pnlValue) / 100;

    let existingPnlIndex = pnlList.findIndex(
      (item) => item.date === formattedPnlDate
    );

    const dayFullName = moment(formattedPnlDate, "DD/MM/YYYY").format("dddd");

    if (existingPnlIndex !== -1) {
      pnlList[existingPnlIndex] = {
        ...pnlList[existingPnlIndex],
        ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
        pnlValue: Number(pnlValue),
        day: dayFullName,
        index: pnlItem.index || pnlList[existingPnlIndex].index,
      };
      console.log(`Updated existing PNL for ${formattedPnlDate}`);
    } else {
      let portfolioObj = {
        ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
        pnlValue: Number(pnlValue),
        cumulativePNL: 0,
        date: formattedPnlDate,
        index: pnlItem.index,
        day: dayFullName,
      };
      pnlList.push(portfolioObj);
      console.log(`Added new PNL for ${formattedPnlDate}`);
    }

    portfolio.totalPnlValue += Number(pnlValue);
  }

  pnlList.sort((a, b) =>
    moment(a.date, "DD/MM/YYYY").diff(moment(b.date, "DD/MM/YYYY"))
  );

  let runningTotal = 0;
  for (let i = 0; i < pnlList.length; i++) {
    runningTotal += Number(pnlList[i].pnlValue);
    pnlList[i].cumulativePNL = runningTotal;
  }

  portfolio.pnlList = pnlList;

  if (pnlList.length > 0) {
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
      todayPNL,
      currentWeekPNL,
      currentMonthPNL,
      MDD,
      DD,
    } = overallPNL(
      pnlList,
      portfolio.lastFridayPreviousMonth,
      portfolio.lastThursdayCurrentMonth,
      portfolio.MDD
    );

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
      currentMonthPNL:
        currentMonthPNL - ((percentage * Number(payloadValue.tax)) / 100 || 0),
      currentDD: DD,
      MDD,
    });

    portfolio.MDDRatio = (MDD / portfolio.totalCapital) * -100;
    portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
    portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;

    const pnlDays = pnlList.length;
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

  portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
  portfolio.currentMonthPNL =
    portfolio.totalPnlValue - (percentage * Number(payloadValue.tax)) / 100 ||
    0;

  let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
  return { status: 200, data: updatedPortfolio };
};

// --- updateGroupPNLAdminController (fixed and updated) ---

export const updateGroupPNLAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }

    const payloadValue = await updatePNLSchema
      .validateAsync(req.body)
      .catch((e) => {
        console.log(e);
        res.status(422).json({ message: e.message });
        return null;
      });

    if (!payloadValue) return;

    console.log(payloadValue, "Payload to Update");

    let groupPortfolio = await getPortfolioById(payloadValue.profileId);
    if (!groupPortfolio) {
      return res.status(410).json({ message: "You have to add deposit first" });
    }

    const originalPayloadPnlList = [...payloadValue.pnlList];
    payloadValue.groupPnlList = originalPayloadPnlList;
    const originalGroupPnlList = [...groupPortfolio.pnlList];

    resetPortfolioMetrics(groupPortfolio);

    let populatedUser = await getUserById(groupPortfolio.userId.toString());
    let groupData = await updatePNLCalculation11(
      payloadValue,
      groupPortfolio,
      groupPortfolio.totalCapital,
      originalGroupPnlList
    );

    console.log("Group portfolio updated successfully");

    for (let user of populatedUser.groupMembers) {
      let userPortfolio = await getPortfolioByUserIdAndMonth(
        user._id.toString(),
        groupPortfolio.month
      );

      if (!userPortfolio) {
        console.log(
          `Skipping user ${user._id} - portfolio not found for month ${groupPortfolio.month}`
        );
        continue;
      }

      console.log(`Processing user ${user._id}`);

      const originalUserPnlList = [...userPortfolio.pnlList];

      const userPnlDates = new Set(
        userPortfolio.pnlList.map((item) => item.date)
      );

      const applicableUserPnls = originalPayloadPnlList.filter((pnl) => {
        const formattedDate = moment(pnl.date, "DD/MM/YYYY").format(
          "DD/MM/YYYY"
        );
        return userPnlDates.has(formattedDate);
      });

      if (applicableUserPnls.length === 0) {
        console.log(`Skipping user ${user._id} - no matching PNL entries`);
        continue;
      }

      resetPortfolioMetrics(userPortfolio);

      const userPayload = {
        ...payloadValue,
        pnlList: applicableUserPnls,
        groupPnlList: originalPayloadPnlList,
      };

      console.log(
        `Updating ${userPayload.pnlList.length} PNL entries for user ${user._id}`
      );

      await updatePNLCalculation1(
        userPayload,
        userPortfolio,
        groupPortfolio.totalCapital,
        originalUserPnlList,
        populatedUser.groupMembers
      );

      console.log(`Updated portfolio for user ${user._id}`);
    }

    res.status(groupData.status).json(groupData.data);
  } catch (error) {
    console.log("error in updateGroupPNLAdminController", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};

// --- resetPortfolioMetrics (same as you provided, no change) ---

function resetPortfolioMetrics(portfolio) {
  portfolio.tax = 0;
  portfolio.totalPnlValue = 0;
  portfolio.totalROI = 0;
  portfolio.winDays = 0;
  portfolio.winRation = 0;
  portfolio.avgProfit = 0;
  portfolio.totalWinProfit = 0;
  portfolio.maxProfit = 0;
  portfolio.todayPNL = 0;
  portfolio.currentWeekPNL = 0;
  portfolio.currentMonthPNL = 0;
  portfolio.currentDD = 0;
  portfolio.lossDays = 0;
  portfolio.lossRation = 0;
  portfolio.avgLoss = 0;
  portfolio.totalLoss = 0;
  portfolio.maxLoss = 0;
  portfolio.maxWinStreak = 0;
  portfolio.maxLossStreak = 0;
  portfolio.MDD = 0;
  portfolio.MDDRatio = 0;
  portfolio.riskReward = 0;
  portfolio.expectancy = 0;
}

// export const updateGroupPNLAdminController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const authUser = req.authUser;
//     if (!authUser) {
//       return res.status(403).json("unauthorized request !");
//     }
//     const payloadValue = await updatePNLSchema
//       .validateAsync(req.body)
//       .then((value) => value)
//       .catch((e) => {
//         console.log(e);
//         res.status(422).json({ message: e.message });
//         return null;
//       });

//     if (!payloadValue) {
//       return;
//     }
//     console.log(payloadValue, "??????????????");

//     let portfolio = await getPortfolioById(payloadValue.profileId);
//     if (!portfolio) {
//       return res.status(410).json({ message: "You have to add deposit first" });
//     }
//     payloadValue.groupPnlList = payloadValue.pnlList;
//     console.log("!!!!!!!!!!!!!!", payloadValue.groupPnlList);
//     let oldPnlList = portfolio.pnlList;
//     portfolio.pnlList = [];
//     portfolio.tax = 0;
//     portfolio.totalPnlValue = 0;
//     portfolio.totalROI = 0;
//     portfolio.winDays = 0;
//     portfolio.winRation = 0;
//     portfolio.avgProfit = 0;
//     portfolio.totalWinProfit = 0;
//     portfolio.maxProfit = 0;
//     portfolio.todayPNL = 0;
//     portfolio.currentWeekPNL = 0;
//     portfolio.currentMonthPNL = 0;
//     portfolio.currentDD = 0;
//     portfolio.lossDays = 0;
//     portfolio.lossRation = 0;
//     portfolio.avgLoss = 0;
//     portfolio.totalLoss = 0;
//     portfolio.maxLoss = 0;
//     portfolio.maxWinStreak = 0;
//     portfolio.maxLossStreak = 0;
//     portfolio.MDD = 0;
//     portfolio.MDDRatio = 0;
//     portfolio.riskReward = 0;
//     portfolio.expectancy = 0;
//     let data = await updatePNLCalculation1(
//       payloadValue,
//       portfolio,
//       portfolio.totalCapital,
//       null
//       // oldPnlList
//     );
//     let populatedUser = await getUserById(portfolio.userId.toString());
//     for (let user of populatedUser.groupMembers) {
//       let userPortfolio = await getPortfolioByUserIdAndMonth(
//         user._id.toString(),
//         portfolio.month
//       );
//       if (!userPortfolio) {
//         return res
//           .status(410)
//           .json({ message: "You have to add deposit first" });
//       }
//       let oldPnlList = userPortfolio.pnlList;
//       userPortfolio.pnlList = [];
//       userPortfolio.tax = 0;
//       userPortfolio.totalPnlValue = 0;
//       userPortfolio.totalROI = 0;
//       userPortfolio.winDays = 0;
//       userPortfolio.winRation = 0;
//       userPortfolio.avgProfit = 0;
//       userPortfolio.totalWinProfit = 0;
//       userPortfolio.maxProfit = 0;
//       userPortfolio.todayPNL = 0;
//       userPortfolio.currentWeekPNL = 0;
//       userPortfolio.currentMonthPNL = 0;
//       userPortfolio.currentDD = 0;
//       userPortfolio.lossDays = 0;
//       userPortfolio.lossRation = 0;
//       userPortfolio.avgLoss = 0;
//       userPortfolio.totalLoss = 0;
//       userPortfolio.maxLoss = 0;
//       userPortfolio.maxWinStreak = 0;
//       userPortfolio.maxLossStreak = 0;
//       userPortfolio.MDD = 0;
//       userPortfolio.MDDRatio = 0;
//       userPortfolio.riskReward = 0;
//       userPortfolio.expectancy = 0;
//       console.log(
//         "************-------------------------^^^^^^^^^^^^^^^^^^^^^^^",
//         payloadValue
//       );

//       data = await updatePNLCalculation1(
//         payloadValue,
//         userPortfolio,
//         portfolio.totalCapital,
//         oldPnlList
//       );
//     }
//     res.status(data.status).json(data.data);
//   } catch (error) {
//     console.log("error", "error in updateGroupPNLAdminController", error);
//     return res.status(500).json({
//       message: "Something happened wrong try again after sometime",
//       error: JSON.stringify(error),
//     });
//   }
// };

const updatePNLCalculation = async (
  payloadValue,
  portfolio,
  totalCapital,
  oldPnlList
) => {
  console.log(payloadValue.groupPnlList, "++++++++++++++++");
  let percentage = (portfolio.totalCapital * 100) / totalCapital;
  const currentDate = moment().format("DD/MM/YYYY");
  let pnlList = [];
  for (const pnlItem of payloadValue.pnlList) {
    console.log(oldPnlList, "/////////////");
    let originalPnlValue = payloadValue.groupPnlList.find(
      (ele) => ele.date == pnlItem.date
    );
    console.log(originalPnlValue, "originalPnlValue...........");
    let aa = oldPnlList.find((ele) => ele.date == pnlItem.date);
    console.log(aa, "555555555555555555");
    console.log(pnlItem.date, currentDate);

    const isDateValid = moment(pnlItem.date, "DD/MM/YYYY").isSameOrAfter(
      moment(currentDate, "DD/MM/YYYY")
    );
    // const isDateValid = moment(pnlItem.date, "DD/MM/YYYY").isSameOrAfter(
    //   moment(currentDate, "DD/MM/YYYY")
    // );
    console.log(isDateValid, "$$$$$$$$$$$$$$$$");
    let pnlValue;
    if (!isDateValid) {
      if (aa) {
        pnlValue = Number(aa.pnlValue);
        let portfolioObj = {
          ROI: calculateROI(portfolio.totalCapital, pnlValue),
          pnlValue: pnlValue,
          cumulativePNL: portfolio.totalPnlValue + pnlValue,
          date: pnlItem.date,
          index: pnlItem.index,
          day: pnlItem.day,
        };
        console.log(portfolioObj, "portfolioObj");
        pnlList.push(portfolioObj);
      }
      console.log(
        `Skipping update for ${pnlItem.date} as it's before current date ${currentDate}`
      );
      // continue; // Skip processing for dates before current date
    } else {
      pnlValue = (percentage * originalPnlValue.pnlValue) / 100;

      let existingPnl = portfolio.pnlList.find(
        (ele) => ele.date === pnlItem.date
      );

      if (existingPnl) {
        return {
          status: 409,
          data: {
            message: `PNL for date ${pnlItem.date} already exists in the portfolio`,
          },
        };
      }
      console.log(pnlItem.date, ">>>>>>>>>>>");
      const itemDate = moment(pnlItem.date, "DD/MM/YYYY");
      console.log(itemDate, "????????????");
      const dayFullName = itemDate.format("dddd");

      let portfolioObj = {
        ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
        pnlValue: Number(pnlValue),
        cumulativePNL: portfolio.totalPnlValue + Number(pnlValue),
        date: pnlItem.date,
        index: pnlItem.index,
        day: dayFullName,
      };
      console.log(portfolioObj, "portfolioObj");
      pnlList.push(portfolioObj);
    }
    // if (aa) {
    //   console.log("date not match");
    //   let pnlValue = (percentage * originalPnlValue.pnlValue) / 100;
    //   // let pnlValue = (percentage * pnlItem.pnlValue) / 100;
    //   // pnlItem.date = moment(pnlItem.date).format("DD/MM/YYYY");
    //   pnlItem.date = moment(pnlItem.date, "DD/MM/YYYY").format("DD/MM/YYYY");
    //   let existingPnl = portfolio.pnlList.find(
    //     (ele) => ele.date === pnlItem.date
    //   );
    //   if (existingPnl) {
    //     return {
    //       status: 409,
    //       data: {
    //         message: `PNL for date ${pnlItem.date} already exists in the portfolio`,
    //       },
    //     };
    //   }
    //   console.log(pnlItem.date, ">>>>>>>>>>>");

    //   const itemDate = moment(pnlItem.date, "DD/MM/YYYY");
    //   console.log(itemDate, "????????????");
    //   const dayFullName = itemDate.format("dddd");

    //   let portfolioObj = {
    //     ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
    //     pnlValue: Number(pnlValue),
    //     cumulativePNL: portfolio.totalPnlValue + Number(pnlValue),
    //     date: pnlItem.date,
    //     index: pnlItem.index,
    //     day: dayFullName,
    //   };
    //   console.log(portfolioObj, "portfolioObj");

    //   portfolio.pnlList.push(portfolioObj);
    //   console.log(portfolio.totalPnlValue, "3333--------------333333333333");
    //   console.log(
    //     Number(pnlValue),
    //     "+++++++++++++++++--------------333333333333"
    //   );

    //   portfolio.totalPnlValue += Number(pnlValue);
    //   console.log(portfolio.totalPnlValue, "*********");
    //   // portfolio.totalPnlValue += Number(pnlValue);
    //   portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
    //   // portfolio.tax += Number(pnlItem.tax) || 0;
    // }
    portfolio.totalPnlValue += Number(pnlValue);
    console.log(portfolio.totalPnlValue, "*********");

    portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
    console.log("---------------------------------------------");
    console.log(pnlList);
    console.log("---------------------------------------------");

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
      pnlList,
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
      currentMonthPNL:
        currentMonthPNL - (percentage * Number(payloadValue.tax)) / 100 || 0,
      currentDD: DD,
      MDD,
    });
    portfolio.pnlList = pnlList;
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
  portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
  portfolio.currentMonthPNL =
    portfolio.totalPnlValue - (percentage * Number(payloadValue.tax)) / 100 ||
    0;
  let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
  return { status: 200, data: updatedPortfolio };
};

export const updatePNLCalculation2 = async (
  payloadValue,
  portfolio,
  totalCapital,
  oldPnlList
) => {
  console.log(payloadValue.groupPnlList, "++++++++++++++++");
  let percentage = (portfolio.totalCapital * 100) / totalCapital;
  const currentDate = moment().format("DD/MM/YYYY");
  let pnlList = [];
  for (const pnlItem of payloadValue.pnlList) {
    // if (oldPnlList) {
    //   let aa = oldPnlList.find((ele) => ele.date == pnlItem.date);
    //   if (aa) {
    //     console.log(payloadValue.groupPnlList, "/////////////");
    //     let originalPnlValue = payloadValue.groupPnlList.find(
    //       (ele) => ele.date == pnlItem.date
    //     );
    //     console.log(originalPnlValue, "originalPnlValue...........");

    //     // Format date consistently
    //     pnlItem.date = moment(pnlItem.date, "DD/MM/YYYY").format("DD/MM/YYYY");

    //     // Check if the date is greater than or equal to current date
    //     const isDateValid = moment(pnlItem.date, "DD/MM/YYYY").isSameOrAfter(
    //       moment(currentDate, "DD/MM/YYYY")
    //     );
    //     console.log(isDateValid, "$$$$$$$$$$$$$$$$");
    //     let pnlValue;
    //     if (!isDateValid) {
    //       pnlValue = Number(pnlItem.pnlValue);
    //       let portfolioObj = {
    //         ROI: calculateROI(portfolio.totalCapital, pnlValue),
    //         pnlValue: pnlValue,
    //         cumulativePNL: portfolio.totalPnlValue + pnlValue,
    //         date: pnlItem.date,
    //         index: pnlItem.index,
    //         day: pnlItem.day,
    //       };
    //       console.log(portfolioObj, "portfolioObj");
    //       pnlList.push(portfolioObj);
    //       console.log(
    //         `Skipping update for ${pnlItem.date} as it's before current date ${currentDate}`
    //       );
    //       // continue; // Skip processing for dates before current date
    //     } else {
    //       pnlValue = (percentage * originalPnlValue.pnlValue) / 100;

    //       let existingPnl = portfolio.pnlList.find(
    //         (ele) => ele.date === pnlItem.date
    //       );

    //       if (existingPnl) {
    //         return {
    //           status: 409,
    //           data: {
    //             message: `PNL for date ${pnlItem.date} already exists in the portfolio`,
    //           },
    //         };
    //       }
    //       console.log(pnlItem.date, ">>>>>>>>>>>");
    //       const itemDate = moment(pnlItem.date, "DD/MM/YYYY");
    //       console.log(itemDate, "????????????");
    //       const dayFullName = itemDate.format("dddd");

    //       let portfolioObj = {
    //         ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
    //         pnlValue: Number(pnlValue),
    //         cumulativePNL: portfolio.totalPnlValue + Number(pnlValue),
    //         date: pnlItem.date,
    //         index: pnlItem.index,
    //         day: dayFullName,
    //       };
    //       console.log(portfolioObj, "portfolioObj");
    //       pnlList.push(portfolioObj);
    //     }

    //     // portfolio.pnlList.push(portfolioObj);
    //     console.log(portfolio.totalPnlValue, "3333--------------333333333333");
    //     console.log(
    //       Number(pnlValue),
    //       "+++++++++++++++++--------------333333333333"
    //     );

    //     portfolio.totalPnlValue += Number(pnlValue);
    //     console.log(portfolio.totalPnlValue, "*********");

    //     portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
    //     console.log("---------------------------------------------");
    //     console.log(pnlList);
    //     console.log("---------------------------------------------");

    //     let {
    //       totalPnlValue,
    //       totalROI,
    //       winDays,
    //       lossDays,
    //       totalWinProfit,
    //       totalLoss,
    //       maxProfit,
    //       maxLoss,
    //       maxWinStreak,
    //       maxLossStreak,
    //       latestProfit,
    //       latestLoss,
    //       todayPNL,
    //       currentWeekPNL,
    //       currentMonthPNL,
    //       maxLatestProfit,
    //       MDD,
    //       DD,
    //     } = overallPNL(
    //       // portfolio.pnlList,
    //       pnlList,
    //       portfolio.lastFridayPreviousMonth,
    //       portfolio.lastThursdayCurrentMonth,
    //       portfolio.MDD
    //     );

    //     // Update portfolio with calculated values
    //     Object.assign(portfolio, {
    //       totalPnlValue,
    //       totalROI,
    //       winDays,
    //       lossDays,
    //       totalWinProfit,
    //       totalLoss,
    //       maxProfit,
    //       maxLoss,
    //       maxWinStreak,
    //       maxLossStreak,
    //       todayPNL,
    //       currentWeekPNL,
    //       currentMonthPNL:
    //         currentMonthPNL -
    //         ((percentage * Number(payloadValue.tax)) / 100 || 0),
    //       currentDD: DD,
    //       MDD,
    //     });
    //     portfolio.pnlList = pnlList;
    //     portfolio.MDDRatio = (MDD / portfolio.totalCapital) * -100;
    //     portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
    //     portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;

    //     const pnlDays = portfolio.pnlList.length;
    //     portfolio.winRation = pnlDays ? (winDays / pnlDays) * 100 : 0;
    //     portfolio.lossRation = pnlDays ? (lossDays / pnlDays) * 100 : 0;

    //     const riskReward = -portfolio.avgProfit / portfolio.avgLoss;
    //     portfolio.riskReward = isFinite(riskReward) ? riskReward : 0;

    //     portfolio.expectancy =
    //       (portfolio.winRation * portfolio.avgProfit) /
    //       (portfolio.lossRation * portfolio.avgLoss);
    //     portfolio.expectancy = isFinite(portfolio.expectancy)
    //       ? portfolio.expectancy
    //       : 0;
    //   }
    // } else {
    console.log(payloadValue.groupPnlList, "/////////////");
    let originalPnlValue = payloadValue.groupPnlList.find(
      (ele) => ele.date == pnlItem.date
    );
    console.log(originalPnlValue, "originalPnlValue...........");

    // Format date consistently
    pnlItem.date = moment(pnlItem.date, "DD/MM/YYYY").format("DD/MM/YYYY");

    // Check if the date is greater than or equal to current date
    const isDateValid = moment(pnlItem.date, "DD/MM/YYYY").isSameOrAfter(
      moment(currentDate, "DD/MM/YYYY")
    );
    console.log(isDateValid, "$$$$$$$$$$$$$$$$");
    let pnlValue;
    if (!isDateValid) {
      pnlValue = Number(pnlItem.pnlValue);
      let portfolioObj = {
        ROI: calculateROI(portfolio.totalCapital, pnlValue),
        pnlValue: pnlValue,
        cumulativePNL: portfolio.totalPnlValue + pnlValue,
        date: pnlItem.date,
        index: pnlItem.index,
        day: pnlItem.day,
      };
      console.log(portfolioObj, "portfolioObj");
      pnlList.push(portfolioObj);
      console.log(
        `Skipping update for ${pnlItem.date} as it's before current date ${currentDate}`
      );
      // continue; // Skip processing for dates before current date
    } else {
      pnlValue = (percentage * originalPnlValue.pnlValue) / 100;

      let existingPnl = portfolio.pnlList.find(
        (ele) => ele.date === pnlItem.date
      );

      if (existingPnl) {
        return {
          status: 409,
          data: {
            message: `PNL for date ${pnlItem.date} already exists in the portfolio`,
          },
        };
      }
      console.log(pnlItem.date, ">>>>>>>>>>>");
      const itemDate = moment(pnlItem.date, "DD/MM/YYYY");
      console.log(itemDate, "????????????");
      const dayFullName = itemDate.format("dddd");

      let portfolioObj = {
        ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
        pnlValue: Number(pnlValue),
        cumulativePNL: portfolio.totalPnlValue + Number(pnlValue),
        date: pnlItem.date,
        index: pnlItem.index,
        day: dayFullName,
      };
      console.log(portfolioObj, "portfolioObj");
      pnlList.push(portfolioObj);
    }

    // portfolio.pnlList.push(portfolioObj);
    console.log(portfolio.totalPnlValue, "3333--------------333333333333");
    console.log(
      Number(pnlValue),
      "+++++++++++++++++--------------333333333333"
    );

    portfolio.totalPnlValue += Number(pnlValue);
    console.log(portfolio.totalPnlValue, "*********");

    portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
    console.log("---------------------------------------------");
    console.log(pnlList);
    console.log("---------------------------------------------");

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
      // portfolio.pnlList,
      pnlList,
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
      currentMonthPNL:
        currentMonthPNL - ((percentage * Number(payloadValue.tax)) / 100 || 0),
      currentDD: DD,
      MDD,
    });
    portfolio.pnlList = pnlList;
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
    // }
  }

  portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
  portfolio.currentMonthPNL =
    portfolio.totalPnlValue - (percentage * Number(payloadValue.tax)) / 100 ||
    0;
  let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
  return { status: 200, data: updatedPortfolio };
};

// export const updatePNLCalculation1 = async (
//   payloadValue,
//   portfolio,
//   totalCapital,
//   oldPnlList
// ) => {
//   console.log(payloadValue.pnlList, "Processing PnL");

//   let percentage = (portfolio.totalCapital * 100) / totalCapital;
//   const currentDate = moment().format("DD/MM/YYYY");

//   let pnlList = [...portfolio.pnlList];

//   portfolio.totalPnlValue = 0;

//   for (const pnlItem of payloadValue.pnlList) {
//     const formattedPnlDate = moment(pnlItem.date, "DD/MM/YYYY").format(
//       "DD/MM/YYYY"
//     );

//     let originalPnlValue = payloadValue.groupPnlList.find(
//       (ele) => ele.date === pnlItem.date
//     );

//     let pnlValue = (percentage * originalPnlValue.pnlValue) / 100;

//     let existingPnlIndex = pnlList.findIndex(
//       (item) => item.date === formattedPnlDate
//     );

//     if (existingPnlIndex !== -1) {
//       const dayFullName = moment(formattedPnlDate, "DD/MM/YYYY").format("dddd");

//       pnlList[existingPnlIndex] = {
//         ...pnlList[existingPnlIndex],
//         ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
//         pnlValue: Number(pnlValue),
//         day: dayFullName,
//         index: pnlItem.index || pnlList[existingPnlIndex].index,
//       };

//       console.log(`Updated existing PNL for ${formattedPnlDate}`);
//     } else {
//       const dayFullName = moment(formattedPnlDate, "DD/MM/YYYY").format("dddd");

//       let portfolioObj = {
//         ROI: calculateROI(portfolio.totalCapital, Number(pnlValue)),
//         pnlValue: Number(pnlValue),
//         cumulativePNL: 0,
//         date: formattedPnlDate,
//         index: pnlItem.index,
//         day: dayFullName,
//       };

//       pnlList.push(portfolioObj);
//       console.log(`Added new PNL for ${formattedPnlDate}`);
//     }

//     portfolio.totalPnlValue += Number(pnlValue);
//   }

//   pnlList.sort((a, b) =>
//     moment(a.date, "DD/MM/YYYY").diff(moment(b.date, "DD/MM/YYYY"))
//   );

//   let runningTotal = 0;
//   for (let i = 0; i < pnlList.length; i++) {
//     runningTotal += Number(pnlList[i].pnlValue);
//     pnlList[i].cumulativePNL = runningTotal;
//   }

//   portfolio.pnlList = pnlList;

//   if (pnlList.length > 0) {
//     let {
//       totalPnlValue,
//       totalROI,
//       winDays,
//       lossDays,
//       totalWinProfit,
//       totalLoss,
//       maxProfit,
//       maxLoss,
//       maxWinStreak,
//       maxLossStreak,
//       todayPNL,
//       currentWeekPNL,
//       currentMonthPNL,
//       MDD,
//       DD,
//     } = overallPNL(
//       pnlList,
//       portfolio.lastFridayPreviousMonth,
//       portfolio.lastThursdayCurrentMonth,
//       portfolio.MDD
//     );

//     Object.assign(portfolio, {
//       totalPnlValue,
//       totalROI,
//       winDays,
//       lossDays,
//       totalWinProfit,
//       totalLoss,
//       maxProfit,
//       maxLoss,
//       maxWinStreak,
//       maxLossStreak,
//       todayPNL,
//       currentWeekPNL,
//       currentMonthPNL:
//         currentMonthPNL - ((percentage * Number(payloadValue.tax)) / 100 || 0),
//       currentDD: DD,
//       MDD,
//     });

//     portfolio.MDDRatio = (MDD / portfolio.totalCapital) * -100;
//     portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
//     portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;

//     const pnlDays = pnlList.length;
//     portfolio.winRation = pnlDays ? (winDays / pnlDays) * 100 : 0;
//     portfolio.lossRation = pnlDays ? (lossDays / pnlDays) * 100 : 0;

//     const riskReward = -portfolio.avgProfit / portfolio.avgLoss;
//     portfolio.riskReward = isFinite(riskReward) ? riskReward : 0;

//     portfolio.expectancy =
//       (portfolio.winRation * portfolio.avgProfit) /
//       (portfolio.lossRation * portfolio.avgLoss);

//     portfolio.expectancy = isFinite(portfolio.expectancy)
//       ? portfolio.expectancy
//       : 0;
//   }

//   portfolio.tax = (percentage * Number(payloadValue.tax)) / 100 || 0;
//   portfolio.currentMonthPNL =
//     portfolio.totalPnlValue - (percentage * Number(payloadValue.tax)) / 100 ||
//     0;

//   let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
//   return { status: 200, data: updatedPortfolio };
// };

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
    let user = await getUserById(userId);
    if (!user) {
      return res.status(403).send({
        message: "User not found",
      });
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
    // console.log(isDeposit, "***********");
    let existingAmountEntry = await AmountModel.findOne({
      userId,
      month,
      // paymentMode: payloadValue.paymentMode,
      amountType: isDeposit ? "deposit" : "withdrawal",
    });
    let existingAmountGroup = await AmountModel.findOne({
      userId: user.groupId,
      month,
      // paymentMode: payloadValue.paymentMode,
      amountType: isDeposit ? "deposit" : "withdrawal",
    });
    // console.log(existingAmountGroup, "%%%%%%%%%%%%");

    if (existingAmountEntry) {
      return res.status(401).send({
        message: "A transaction (deposit or withdrawal) has already been made.",
      });
    } else if (!isDeposit) {
      existingAmountEntry = await AmountModel.findOne({
        userId,
        month,
        // paymentMode: payloadValue.paymentMode,
        amountType: "deposit",
      });
      existingAmountGroup = await AmountModel.findOne({
        userId,
        month,
        // paymentMode: payloadValue.paymentMode,
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
      if (!existingAmountGroup) {
        console.log(existingAmountGroup, "&&&&&");
        return res.status(400).send({ message: "You have to deposit first" });
      } else {
        // update existing amount
        existingAmountGroup.amount = -payloadValue.amount;
        await updateAmount(existingAmountGroup);
        // // Create a new entry
        // payloadValue.amountType = isDeposit ? "deposit" : "withdrawal";
        // payloadValue.userId = user.groupId;
        // await saveAmount(new AmountModel(payloadValue));
      }
    } else {
      // Create a new entry
      payloadValue.amountType = isDeposit ? "deposit" : "withdrawal";
      await saveAmount(new AmountModel(payloadValue));
      if (existingAmountGroup) {
        existingAmountGroup.amount =
          existingAmountGroup.amount + payloadValue.amount;
        // console.log(existingAmountGroup, "existingAmountGroup");

        await updateAmount(existingAmountGroup);
      } else {
        payloadValue.userId = user.groupId;
        await saveAmount(new AmountModel(payloadValue));
      }
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

      let groupPortfolio = await getPortfolioByUserIdAndMonth(
        user.groupId.toString(),
        payloadValue.month
      );
      // console.log(groupPortfolio, "????????????");
      // console.log(payloadValue, "payloadValueeeeeeeee");

      if (groupPortfolio) {
        groupPortfolio.totalCapital =
          groupPortfolio.totalCapital + payloadValue.amount;
        // console.log(groupPortfolio, "groupPortfolio");

        await updatePortfolio(groupPortfolio);
      } else {
        await savePortfolio(
          new PortfolioModel({
            userId: user.groupId,
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

export const editAmountAdminController = async (
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
      return res.status(403).send({ message: "Invalid userId provided" });
    }
    let user = await getUserById(userId);
    if (!user) {
      return res.status(403).send({ message: "user not found" });
    }

    const payloadValue = await editAmountSchema
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
    let portfolio = await getPortfolioByUserIdAndMonth(
      userId,
      payloadValue.month
    );

    // let portfolio = await getPortfolioById(payloadValue.profileId);
    if (!portfolio) {
      return res.status(410).json({ message: "You have to add deposit first" });
    }
    let grouPortfolio = await getPortfolioByUserIdAndMonth(
      user.groupId.toString(),
      payloadValue.month
    );
    if (!grouPortfolio) {
      return res.status(410).json({ message: "You have to add deposit first" });
    }
    let existingAmountEntry = await AmountModel.findOne({
      userId,
      month: payloadValue.month,
      amountType: "deposit",
    });
    if (!existingAmountEntry) {
      return res.status(410).json({ message: "You have to add deposit first" });
    }
    let existingAmountGroup = await AmountModel.findOne({
      userId: user.groupId,
      month: payloadValue.month,
      amountType: "deposit",
    });
    console.log(existingAmountGroup, "???????????????");

    if (existingAmountGroup) {
      existingAmountGroup.amount =
        existingAmountGroup.amount -
        existingAmountEntry.amount +
        payloadValue.amount;
      console.log(existingAmountGroup.amount, "?????????");

      await updateAmount(existingAmountGroup);
    }
    existingAmountEntry.amount = payloadValue.amount;
    await updateAmount(existingAmountEntry);

    //-----------group--------------
    payloadValue.pnlList = grouPortfolio.pnlList;
    payloadValue.groupPnlList = grouPortfolio.pnlList;
    payloadValue.pnl = grouPortfolio.totalPnlValue;
    payloadValue.tax = grouPortfolio.tax;

    grouPortfolio.pnlList = [];
    grouPortfolio.totalCapital = existingAmountGroup.amount;
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
      grouPortfolio.totalCapital,
      null
    );
    ///-------------end-------
    let populatedUser = await getUserById(grouPortfolio.userId.toString());
    for (let user of populatedUser.groupMembers) {
      let userPortfolio = await getPortfolioByUserIdAndMonth(
        user._id.toString(),
        portfolio.month
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
        grouPortfolio.totalCapital,
        null
      );
    }
    res.status(data.status).json(data.data);

    //--------------end---------------
    // payloadValue.pnlList = portfolio.pnlList;
    // console.log(payloadValue.pnlList, "%%%%%%-------------%%%%%%%");
    // portfolio.pnlList = [];
    // portfolio.tax = 0;
    // portfolio.totalCapital = payloadValue.amount;
    // portfolio.totalPnlValue = 0;
    // portfolio.totalROI = 0;
    // portfolio.winDays = 0;
    // portfolio.winRation = 0;
    // portfolio.avgProfit = 0;
    // portfolio.totalWinProfit = 0;
    // portfolio.maxProfit = 0;
    // portfolio.todayPNL = 0;
    // portfolio.currentWeekPNL = 0;
    // portfolio.currentMonthPNL = 0;
    // portfolio.currentDD = 0;
    // portfolio.lossDays = 0;
    // portfolio.lossRation = 0;
    // portfolio.avgLoss = 0;
    // portfolio.totalLoss = 0;
    // portfolio.maxLoss = 0;
    // portfolio.maxWinStreak = 0;
    // portfolio.maxLossStreak = 0;
    // portfolio.MDD = 0;
    // portfolio.MDDRatio = 0;
    // portfolio.riskReward = 0;
    // portfolio.expectancy = 0;
    // for (const pnlItem of payloadValue.pnlList) {
    //   console.log(pnlItem, "11111111111");

    //   // pnlItem.date = moment(pnlItem.date).format("DD/MM/YYYY");
    //   pnlItem.date = moment(pnlItem.date, "DD/MM/YYYY").format("DD/MM/YYYY");
    //   let existingPnl = portfolio.pnlList.find(
    //     (ele) => ele.date === pnlItem.date
    //   );
    //   if (existingPnl) {
    //     return res.status(409).json({
    //       message: `PNL for date ${pnlItem.date} already exists in the portfolio`,
    //     });
    //   }
    //   console.log(pnlItem.date, ">>>>>>>>>>>");

    //   const itemDate = moment(pnlItem.date, "DD/MM/YYYY");
    //   console.log(itemDate, "????????????");
    //   const dayFullName = itemDate.format("dddd");

    //   console.log(pnlItem, "11111111111");
    //   let portfolioObj = {
    //     ROI: calculateROI(portfolio.totalCapital, Number(pnlItem.pnlValue)),
    //     pnlValue: Number(pnlItem.pnlValue),
    //     cumulativePNL: portfolio.totalPnlValue + Number(pnlItem.pnlValue),
    //     date: pnlItem.date,
    //     index: pnlItem.index,
    //     day: dayFullName,
    //   };
    //   console.log(portfolioObj, ">>>>>>>>>>>>>");

    //   portfolio.pnlList.push(portfolioObj);
    //   portfolio.totalPnlValue += Number(pnlItem.pnlValue);
    //   portfolio.tax += Number(pnlItem.tax) || 0;
    //   console.log(portfolio.pnlList, "------------>");

    //   let {
    //     totalPnlValue,
    //     totalROI,
    //     winDays,
    //     lossDays,
    //     totalWinProfit,
    //     totalLoss,
    //     maxProfit,
    //     maxLoss,
    //     maxWinStreak,
    //     maxLossStreak,
    //     latestProfit,
    //     latestLoss,
    //     todayPNL,
    //     currentWeekPNL,
    //     currentMonthPNL,
    //     maxLatestProfit,
    //     MDD,
    //     DD,
    //   } = overallPNL(
    //     portfolio.pnlList,
    //     portfolio.lastFridayPreviousMonth,
    //     portfolio.lastThursdayCurrentMonth,
    //     portfolio.MDD
    //   );

    //   // Update portfolio with calculated values
    //   Object.assign(portfolio, {
    //     totalPnlValue,
    //     totalROI,
    //     winDays,
    //     lossDays,
    //     totalWinProfit,
    //     totalLoss,
    //     maxProfit,
    //     maxLoss,
    //     maxWinStreak,
    //     maxLossStreak,
    //     todayPNL,
    //     currentWeekPNL,
    //     currentMonthPNL: currentMonthPNL - (Number(pnlItem.tax) || 0),
    //     currentDD: DD,
    //     MDD,
    //   });

    //   portfolio.MDDRatio = (MDD / portfolio.totalCapital) * -100;
    //   portfolio.avgProfit = winDays ? totalWinProfit / winDays : 0;
    //   portfolio.avgLoss = lossDays ? totalLoss / lossDays : 0;

    //   const pnlDays = portfolio.pnlList.length;
    //   portfolio.winRation = pnlDays ? (winDays / pnlDays) * 100 : 0;
    //   portfolio.lossRation = pnlDays ? (lossDays / pnlDays) * 100 : 0;

    //   const riskReward = -portfolio.avgProfit / portfolio.avgLoss;
    //   portfolio.riskReward = isFinite(riskReward) ? riskReward : 0;

    //   portfolio.expectancy =
    //     (portfolio.winRation * portfolio.avgProfit) /
    //     (portfolio.lossRation * portfolio.avgLoss);
    //   portfolio.expectancy = isFinite(portfolio.expectancy)
    //     ? portfolio.expectancy
    //     : 0;
    // }
    // portfolio.tax = payloadValue.tax;
    // portfolio.currentMonthPNL = portfolio.totalPnlValue - portfolio.tax;
    // let updatedPortfolio = await updatePortfolio(new PortfolioModel(portfolio));
    // res.status(200).json(updatedPortfolio);
  } catch (error) {
    console.log(
      "error",
      "error at editAmountAdminController#################### ",
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
    const payloadValue = await notificationSchema
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
    let body = payloadValue.body;
    let notificationTitle = payloadValue.notificationTitle;
    if (payloadValue.groupId) {
      let group = await findUser({ _id: payloadValue.groupId });
      console.log(group, "--------->");

      if (!group) {
        return res.status(404).json({ message: "group not found" });
      }
      let fcmToken = [];

      //@ts-ignore
      group[0].groupMembers.forEach((user) => {
        //@ts-ignore
        if (user.FCMToken?.length > 0) {
          //@ts-ignore
          fcmToken.push(...user.FCMToken);
        }
      });
      const notificationObj = {
        tokens: fcmToken,
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

      await sendNotification(notificationObj);
    } else {
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

          await sendNotification(notificationObj);
        }

        offset += CHUNK_SIZE;
      }
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
    payloadValue.userId.referredBy = user._id;
    await updateUser(new UserModel(payloadValue.userId));
    if (!user.referrals.includes(payloadValue.userId)) {
      user.referrals.push(payloadValue.userId);
    }
    // user.referrals.push(payloadValue.userId);
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

export const deleteReferralController = async (req: Request, res: Response) => {
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
    user.referredBy = null;
    await updateUser(new UserModel(user));

    // payloadValue.userId.referredBy = null;
    // await updateUser(new UserModel(payloadValue.userId));
    // user.referrals.push(payloadValue.userId);
    // user.referrals = user.referrals.filter(
    //   (referral) => referral != payloadValue.userId
    // );
    const index = payloadValue.userId.referrals.findIndex(
      (id) => id.toString() == userId.toString()
    );
    if (index !== -1) {
      payloadValue.userId.referrals.splice(index, 1);
    } else {
      console.log("UserId not found in referrals");
    }
    // payloadValue.userId.referrals.splice(
    //   payloadValue.userId.referrals.indexOf(userId),
    //   1
    // );
    await updateUser(new UserModel(payloadValue.userId));
    // user.referrals.splice(user.referrals.indexOf(payloadValue.userId), 1);
    // await updateUser(new UserModel(user));
    res.status(200).json("successfull");
  } catch (error) {
    console.log(
      "error",
      "error at deleteReferralController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const deleteMonthlyHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let profolioId = req.params.id;
    if (!profolioId) {
      return res.status(403).json("unauthorized request");
    }
    let portfolio = await getPortfolioById(profolioId);
    if (!portfolio) {
      return res.status(403).json("portfolio not found");
    }
    let month = portfolio.month;
    let userId = portfolio.userId;
    let user = await getUserById(userId.toString());
    let amount = await getAmountByUserIdAndMonth(userId.toString(), month);
    let groupAmount = await getAmountByUserIdAndMonth(
      user.groupId.toString(),
      month
    );
    if (groupAmount) {
      groupAmount.amount = groupAmount.amount - amount.amount;
      console.log(groupAmount, ">>>>>>&&&&&&&&&&&&&&&&>>>>>>>>>>>>>>");

      await updateAmount(groupAmount);
    }
    await deleteAmount(amount._id);
    let groupPortfolio = await getPortfolioByUserIdAndMonth(
      user.groupId.toString(),
      month
    );
    if (groupPortfolio) {
      groupPortfolio.totalCapital = groupPortfolio.totalCapital - amount.amount;
      console.log(groupPortfolio, ">>>>>>>>>>>>>>>>>");

      await updatePortfolio(groupPortfolio);
    }
    await deletePortfolio(portfolio._id);
    await res.status(200).json("successfully deleted");
  } catch (error) {
    console.log(
      "error",
      "error at deleteMonthlyHistoryController#################### ",
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
    let { month } = calculateMonth(new Date());
    console.log(month, "??????????????????");

    let portfolio1 = await getPortfolioByUserIdAndMonth(user._id, month);
    console.log(portfolio1, "???????????????surrruuuuuuuuuuuuuu");

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

export const getLifeTimePortfolioController = async (
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
    let { month } = calculateMonth(new Date());
    let monthlyPortfolios = await getLastPortfolioByUserId(user._id);
    if (monthlyPortfolios.length == 0) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    // Initialize lifetime portfolio with first month's data
    // const lifetimePortfolio = {
    //   userId: user._id,
    //   month: "Lifetime",
    //   lastFridayPreviousMonth: monthlyPortfolios[0].lastFridayPreviousMonth,
    //   lastThursdayCurrentMonth:
    //     monthlyPortfolios[monthlyPortfolios.length - 1]
    //       .lastThursdayCurrentMonth,
    //   totalDays: monthlyPortfolios.reduce(
    //     (sum, portfolio) => sum + portfolio.totalDays,
    //     0
    //   ),
    //   pnlList: monthlyPortfolios.flatMap((portfolio) => portfolio.pnlList),
    //   totalCapital: monthlyPortfolios[0].totalCapital,
    //   tax: monthlyPortfolios.reduce((sum, portfolio) => sum + portfolio.tax, 0),
    //   totalPnlValue: monthlyPortfolios.reduce(
    //     (sum, portfolio) => sum + portfolio.totalPnlValue,
    //     0
    //   ),
    //   createdAt: monthlyPortfolios[0].createdAt,
    //   updatedAt: monthlyPortfolios[monthlyPortfolios.length - 1].updatedAt,
    //   totalROI: monthlyPortfolios.reduce(
    //     (sum, portfolio) => sum + portfolio.totalROI,
    //     0
    //   ),
    //   winDays: monthlyPortfolios.reduce(
    //     (sum, portfolio) => sum + portfolio.winDays,
    //     0
    //   ),
    //   winRation:
    //     monthlyPortfolios.reduce(
    //       (sum, portfolio) => sum + portfolio.winRation,
    //       0
    //     ) / monthlyPortfolios.length,
    //   avgProfit:
    //     monthlyPortfolios.reduce(
    //       (sum, portfolio) => sum + portfolio.avgProfit,
    //       0
    //     ) / monthlyPortfolios.length,
    //   totalWinProfit: monthlyPortfolios.reduce(
    //     (sum, portfolio) => sum + portfolio.totalWinProfit,
    //     0
    //   ),
    //   maxProfit: Math.max(
    //     ...monthlyPortfolios.map((portfolio) => portfolio.maxProfit)
    //   ),
    //   todayPNL: monthlyPortfolios[monthlyPortfolios.length - 1].todayPNL,
    //   currentWeekPNL:
    //     monthlyPortfolios[monthlyPortfolios.length - 1].currentWeekPNL,
    //   currentMonthPNL:
    //     monthlyPortfolios[monthlyPortfolios.length - 1].currentMonthPNL,
    //   currentDD: monthlyPortfolios[monthlyPortfolios.length - 1].currentDD,
    //   lossDays: monthlyPortfolios.reduce(
    //     (sum, portfolio) => sum + portfolio.lossDays,
    //     0
    //   ),
    //   lossRation:
    //     monthlyPortfolios.reduce(
    //       (sum, portfolio) => sum + portfolio.lossRation,
    //       0
    //     ) / monthlyPortfolios.length,
    //   avgLoss:
    //     monthlyPortfolios.reduce(
    //       (sum, portfolio) => sum + portfolio.avgLoss,
    //       0
    //     ) / monthlyPortfolios.length,
    //   totalLoss: monthlyPortfolios.reduce(
    //     (sum, portfolio) => sum + portfolio.totalLoss,
    //     0
    //   ),
    //   maxLoss: Math.min(
    //     ...monthlyPortfolios.map((portfolio) => portfolio.maxLoss)
    //   ),
    //   maxWinStreak: Math.max(
    //     ...monthlyPortfolios.map((portfolio) => portfolio.maxWinStreak)
    //   ),
    //   maxLossStreak: Math.max(
    //     ...monthlyPortfolios.map((portfolio) => portfolio.maxLossStreak)
    //   ),
    //   MDD: Math.max(...monthlyPortfolios.map((portfolio) => portfolio.MDD)),
    //   MDDRatio: Math.max(
    //     ...monthlyPortfolios.map((portfolio) => portfolio.MDDRatio)
    //   ),
    //   riskReward:
    //     monthlyPortfolios.reduce(
    //       (sum, portfolio) => sum + portfolio.riskReward,
    //       0
    //     ) / monthlyPortfolios.length,
    //   expectancy:
    //     monthlyPortfolios.reduce(
    //       (sum, portfolio) => sum + portfolio.expectancy,
    //       0
    //     ) / monthlyPortfolios.length,
    // };

    let totalCapital = monthlyPortfolios.reduce(
      (sum, portfolio) => sum + portfolio.totalCapital,
      0
    );
    let totalPnlValue = monthlyPortfolios.reduce(
      (sum, portfolio) => sum + portfolio.totalPnlValue,
      0
    );
    monthlyPortfolios[0].totalPnlValue = totalPnlValue;
    monthlyPortfolios[0].totalCapital = totalCapital;

    return res.status(200).json(monthlyPortfolios[0]);
  } catch (error) {
    console.log(
      "error",
      "error at getLifeTimePortfolioController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};
export const getLifeTimeGroupPortfolioController = async (
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
    let portfolioList = [];
    let { month } = calculateMonth(new Date());

    let groupPortfolio = await getPortfolioByUserIdAndMonth(
      user._id.toString(),
      month
    );

    console.log(groupPortfolio, "groupPortfolio");

    if (!groupPortfolio) {
      console.log("iffffffffffffffffffff");

      let groupPortfolio = {
        userId: user,
        totalPnlValue: 0,
        totalCapital: 0,
      };
      for (let member of user.groupMembers) {
        // console.log(member, "???????????????");
        let user = await getUserById(member.toString());
        let portfolio = {
          userId: user,
          totalPnlValue: 0,
          totalCapital: 0,
        };
        portfolioList.push(portfolio);
      }
      return res.status(200).json({ groupPortfolio, portfolioList });
      return res.status(404).json({ message: "Portfolio not found" });
    } else {
      //@ts-ignore
      groupPortfolio.userId = user;
      console.log("elseeeeeeeeee");

      // let totalCapital = groupPortfolio.reduce(
      //   (sum, groupPortfolio) => sum + groupPortfolio.totalCapital,
      //   0
      // );
      // let totalPnlValue = groupPortfolio.reduce(
      //   (sum, groupPortfolio) => sum + groupPortfolio.totalPnlValue,
      //   0
      // );
      groupPortfolio.totalPnlValue = groupPortfolio.totalPnlValue;
      // groupPortfolio.totalPnlValue = totalPnlValue;
      groupPortfolio.totalCapital = groupPortfolio.totalCapital;
      // groupPortfolio.totalCapital = totalCapital;
      for (let member of user.groupMembers) {
        let portfolio = await getPortfolioByUserIdAndMonth1(
          member._id.toString(),
          month
        );
        // let portfolio = await getLastPortfolioByUserId(member._id.toString());
        // console.log(portfolio, ">>>>>>>>>>");

        if (!portfolio) {
          let user = await getUserById(member._id.toString());
          let portfolioData = {
            userId: user,
            totalPnlValue: 0,
            totalCapital: 0,
          };
          portfolioList.push(portfolioData);
          // return res.status(404).json({ message: "Portfolio not found" });
        } else {
          let totalCapital = portfolio.totalCapital;
          // let totalCapital = portfolio.reduce(
          //   (sum, portfolio) => sum + portfolio.totalCapital,
          //   0
          // );
          let totalPnlValue = portfolio.totalPnlValue;
          // let totalPnlValue = portfolio.reduce(
          //   (sum, portfolio) => sum + portfolio.totalPnlValue,
          //   0
          // );
          portfolio.totalPnlValue = totalPnlValue;
          portfolio.totalCapital = totalCapital;
          portfolioList.push(portfolio);
        }
      }
      return res.status(200).json({ groupPortfolio, portfolioList });
    }
  } catch (error) {
    console.log(
      "error",
      "error at getLifeTimeGroupPortfolioController#################### ",
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

export const deleteLeaderUserController = async (
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

    user.isLeader = false;
    await updateUser(new UserModel(user));
    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(
      "error",
      "error at deleteLeaderUserController#################### ",
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

export const addWatchListController = async (req: Request, res: Response) => {
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
    const payloadValue = await addWatchListSchema
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
    await saveWatchList(
      new WatchListModel({ leaderId: userId, userId: payloadValue.userId })
    );
    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(
      "error",
      "error at addWatchListController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getWatchListController = async (req: Request, res: Response) => {
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
    let users = await getWatchListByLeaderId(userId);
    return res.status(200).json(users);
  } catch (error) {
    console.log(
      "error",
      "error at getWatchListController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const deleteWatchListController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let watchListId = req.params.id;
    if (!watchListId) {
      return res.status(403).json("unauthorized request");
    }
    let watchList = await getWatchListById(watchListId);
    if (!watchList) {
      return res.status(403).json("watchList not found");
    }
    await deleteWatchList(watchListId);
    return res.status(200).json({ message: "watchList deleted successfully" });
  } catch (error) {
    console.log(
      "error",
      "error at deleteWatchListController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getUserController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let users = await getNormalUser();
    return res.status(200).json(users);
  } catch (error) {
    console.log(
      "error",
      "error at getUserController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const hideUnhideUserController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    const payloadValue = await hideUnhideUserSchema
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
    let user = payloadValue.userId;
    user.isHide = payloadValue.isHide;
    await updateUser(user);
    return res.status(200).json(user);
  } catch (error) {
    console.log(
      "error",
      "error at hideUnhideUserController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getHideUserController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let userList = [];
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let { month } = calculateMonth(new Date());
    const allPopulatedUser = await getAllUser(true, page, limit);
    for await (let user of allPopulatedUser) {
      const userObj = user.toObject() as IUser & {
        totalInvestment: number;
        month: string;
      };
      let investmentData = await getAmountByUserIdAndMonth(user._id, month);
      userObj.totalInvestment = investmentData ? investmentData.amount : 0;
      userObj.month = investmentData ? investmentData.month : "";
      userList.push(userObj);
    }
    return res.status(200).json(userList);
  } catch (error) {
    console.log(
      "error",
      "error at getHideUserController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};
//gethideUser for hide uer tab
export const getHideUserController1 = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let { month } = calculateMonth(new Date());
    const allPopulatedUser = await UserModel.find({
      isHide: true,
      isDeleted: false,
    });
    let userList = [];
    for await (let user of allPopulatedUser) {
      const userObj = user.toObject() as IUser & {
        totalInvestment: number;
        month: string;
      };
      let investmentData = await getAmountByUserIdAndMonth(user._id, month);
      userObj.totalInvestment = investmentData ? investmentData.amount : 0;
      userObj.month = investmentData ? investmentData.month : "";
      userList.push(userObj);
    }
    return res.status(200).json(userList);
  } catch (error) {
    console.log(
      "error",
      "error at getHideUserController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const getUserNotInGroupController = async (
  req: Request,
  res: Response
) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let userList = await findUser({
      groupId: null,
      groupMembers: [],
      userType: "USER",
    });
    return res.status(200).json(userList);
  } catch (error) {
    console.log(
      "error",
      "error at getUserNotInGroupController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const removeUserController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let userId = req.query.userId;
    if (!userId) {
      return res.status(402).json({ message: "userId not found" });
    }
    let groupId = req.query.groupId;
    if (!groupId) {
      return res.status(402).json({ message: "groupId not found" });
    }
    let user = await findUser({ _id: userId });
    if (user.length == 0) {
      return res.status(402).json({ message: "user not found" });
    }
    let group = await findUser({ _id: groupId });
    if (group.length == 0) {
      return res.status(402).json({ message: "group not found" });
    }
    user[0].groupId = null;
    console.log(user[0], "userrrrrrrrrrrrrrrrr");

    await updateUser(new UserModel(user[0]));
    group[0].groupMembers = group[0].groupMembers.filter(
      (member) => member._id.toString() != userId.toString()
    );
    console.log(group[0], "groupppppppppppp");

    await updateUser(new UserModel(group[0]));
    return res.status(200).json({ message: "user removed" });
  } catch (error) {
    console.log(
      "error",
      "error at removeUserController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};

export const addUserController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let userId = req.query.userId;
    if (!userId) {
      return res.status(402).json({ message: "userId not found" });
    }
    let groupId = req.query.groupId;
    if (!groupId) {
      return res.status(402).json({ message: "groupId not found" });
    }
    let user = await findUser({ _id: userId });
    if (user.length == 0) {
      return res.status(402).json({ message: "user not found" });
    }
    let group = await findUser({ _id: groupId });
    if (group.length == 0) {
      return res.status(402).json({ message: "group not found" });
    }
    user[0].groupId = new Types.ObjectId(groupId.toString());
    console.log(user[0], "userrrrrrrrrrrrrrrrr");

    await updateUser(new UserModel(user[0]));
    group[0].groupMembers.push(new Types.ObjectId(userId.toString()));
    console.log(group[0], "groupppppppppppp");

    await updateUser(new UserModel(group[0]));
    return res.status(200).json({ message: "user added" });
  } catch (error) {
    console.log(
      "error",
      "error at addUserController#################### ",
      error
    );
    return res.status(500).json({
      message: "Something happened wrong try again after sometime.",
      error: error,
    });
  }
};
