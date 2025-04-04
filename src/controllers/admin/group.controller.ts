import { Response, response } from "express";
import { Request } from "../../request";

import Joi, { isError } from "joi";
import moment from "moment";
import { getAllGroup, saveGroup } from "../../services/group.service";
import { GroupModel } from "../../models/group.model";
import { findPortfolio } from "../../services/portfolio.service";
import { calculateMonth } from "../../helper/calculation";
import {
  findUser,
  getUserById,
  saveUser,
  updateUser,
} from "../../services/user.service";
import { UserModel } from "../../models/user.model";

export const addGroupSchema = Joi.object({
  firstName: Joi.string().required(),
});
export const addUserInGroupSchema = Joi.object({
  groupId: Joi.string()
    .required()
    .external(async (v) => {
      let group;
      if (v) {
        group = await getUserById(v);
        if (!group) {
          throw new Joi.ValidationError(
            "group not found",
            [
              {
                message: "group not found",
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

export const createGroupController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    const payloadValue = await addGroupSchema
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
    payloadValue.userType = "GROUP";
    await saveUser(new UserModel(payloadValue));
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(
      "error",
      "error at createGroupController#################### ",
      error
    );
    res.status(500).json({ message: error.message });
  }
};

export const addUserInGroupController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    let userId = req.params.userId;
    const payloadValue = await addUserInGroupSchema
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
    if (!payloadValue.groupId.groupMembers.includes(userId))
      payloadValue.groupId.groupMembers.push(userId);
    let user = await getUserById(userId);
    user.groupId = payloadValue.groupId._id;
    await updateUser(user);
    await updateUser(payloadValue.groupId);

    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log(
      "error",
      "error at addUserInGroupController#################### ",
      error
    );
    res.status(500).json({ message: error.message });
  }
};

export const getGroupController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    let groupId = req.query.groupId;
    let group;
    if (groupId) {
      group = await findUser({
        _id: groupId,
        userType: "GROUP",
        isDeleted: false,
      });
    } else {
      group = await findUser({ userType: "GROUP", isDeleted: false });
    }

    res.status(200).json(group);
  } catch (error) {
    console.log(
      "error",
      "error at getGroupController#################### ",
      error
    );
    res.status(500).json({ message: error.message });
  }
};

export const suiteController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }
    let { month } = calculateMonth(new Date());
    let portfolio = await findPortfolio({
      month,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
    // console.log(portfolio.length, "??????????");

    let filteredPortfolio = portfolio.filter((portfolio) => {
      // console.log(portfolio, "%%%%%%%%%%");

      // console.log(portfolio.userId, "####");

      //@ts-ignore
      if (portfolio?.userId?.userType == "USER") {
        return portfolio;
      }
    });
    // console.log(filteredPortfolio.length, "@@@@@@@@?");
    const group = filteredPortfolio.reduce(
      (acc, curr) => {
        return {
          totalCapital: acc.totalCapital + curr.totalCapital,
          MDD: Math.max(acc.MDD, curr.MDD),
          ROI: acc.ROI + curr.totalROI,
          pnlValue: acc.pnlValue + curr.totalPnlValue,
          // pnlValue:
          //   acc.pnlValue +
          //     curr.pnlList.find(
          //       (e) => e.date === moment(Date.now()).format("DD/MM/YYYY")
          //     )?.pnlValue || 0,
        };
      },
      {
        totalCapital: 0,
        MDD: 0,
        ROI: 0,
        pnlValue: 0,
      }
    );

    res.status(200).json(group);
  } catch (error) {
    console.log(
      "error",
      "error at suiteController#################### ",
      error
    );
    res.status(500).json({ message: error.message });
  }
};

export const suiteHistoryController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }

    // Get the current date and last 12 months
    const currentDate = new Date();
    const months = [];

    // Generate array of last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      const { month } = calculateMonth(date);
      months.push(month);
    }

    // Fetch portfolio data for all months
    const portfolios = await findPortfolio({
      month: { $in: months },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
    // Group portfolios by month
    const monthlyData = months
      .map((month) => {
        const monthPortfolios = portfolios.filter((p) => p.month === month);

        // Filter for USER type portfolios
        const filteredPortfolios = monthPortfolios.filter(
          //@ts-ignore
          (portfolio) => portfolio?.userId?.userType === "USER"
        );

        // Skip months with no data
        if (filteredPortfolios.length === 0) {
          return null;
        }
        // Aggregate pnlList entries by date
        const aggregatedPnlList = filteredPortfolios.reduce(
          (acc, portfolio) => {
            portfolio.pnlList.forEach((pnlEntry) => {
              const existingEntry = acc.find(
                (entry) => entry.date === pnlEntry.date
              );

              if (existingEntry) {
                // If entry for this date exists, sum the values
                existingEntry.pnlValue += pnlEntry.pnlValue;
                existingEntry.cumulativePNL += pnlEntry.cumulativePNL;
              } else {
                // If no entry exists for this date, add a new one
                acc.push({
                  date: pnlEntry.date,
                  day: pnlEntry.day,
                  pnlValue: pnlEntry.pnlValue,
                  cumulativePNL: pnlEntry.cumulativePNL,
                });
              }
            });
            return acc;
          },
          []
        );

        // Sort pnlList by date
        aggregatedPnlList.sort((a, b) => {
          const [dayA, monthA, yearA] = a.date.split("/").map(Number);
          const [dayB, monthB, yearB] = b.date.split("/").map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          return dateB.getTime() - dateA.getTime(); // Compare timestamps instead of Date objects
        });
        // Calculate aggregates for each month
        const monthGroup = filteredPortfolios.reduce(
          (acc, curr) => ({
            month: acc.month,
            totalCapital: acc.totalCapital + curr.totalCapital,
            tax: acc.tax + curr.tax,
            MDD: Math.max(acc.MDD, curr.MDD),
            ROI: acc.ROI + curr.totalROI,
            pnlValue: acc.pnlValue + curr.totalPnlValue,
            pnlList: aggregatedPnlList,
          }),
          {
            month: month,
            totalCapital: 0,
            tax: 0,
            MDD: 0,
            ROI: 0,
            pnlValue: 0,
            pnlList: [],
          }
        );

        return monthGroup;
      })
      .filter(Boolean); // Remove null entries
    let portfolio = await findPortfolio({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
    // console.log(portfolio.length, "??????????");

    let filteredPortfolio = portfolio.filter((portfolio) => {
      // console.log(portfolio, "%%%%%%%%%%");

      // console.log(portfolio.userId, "####");

      //@ts-ignore
      if (portfolio?.userId?.userType == "USER") {
        return portfolio;
      }
    });
    // console.log(filteredPortfolio.length, "@@@@@@@@?");
    const group = filteredPortfolio.reduce(
      (acc, curr) => {
        return {
          totalCapital: acc.totalCapital + curr.totalCapital,
          MDD: Math.max(acc.MDD, curr.MDD),
          ROI: acc.ROI + curr.totalROI,
          pnlValue: acc.pnlValue + curr.totalPnlValue,
          // pnlValue:
          //   acc.pnlValue +
          //     curr.pnlList.find(
          //       (e) => e.date === moment(Date.now()).format("DD/MM/YYYY")
          //     )?.pnlValue || 0,
        };
      },
      {
        totalCapital: 0,
        MDD: 0,
        ROI: 0,
        pnlValue: 0,
      }
    );

    let allLeader = await findUser({
      userType: "GROUP",
      isHide: false,
      isDeleted: false,
    });
    let lifeTimeLeaderData = [];
    for await (let user of allLeader) {
      let filteredPortfolio = await findPortfolio({ userId: user._id });
      const group = filteredPortfolio.reduce(
        (acc, curr) => {
          return {
            totalCapital: acc.totalCapital + curr.totalCapital,
            MDD: Math.max(acc.MDD, curr.MDD),
            ROI: acc.ROI + curr.totalROI,
            pnlValue: acc.pnlValue + curr.totalPnlValue,
            // pnlValue:
            //   acc.pnlValue +
            //     curr.pnlList.find(
            //       (e) => e.date === moment(Date.now()).format("DD/MM/YYYY")
            //     )?.pnlValue || 0,
          };
        },
        {
          totalCapital: 0,
          MDD: 0,
          ROI: 0,
          pnlValue: 0,
        }
      );
      lifeTimeLeaderData.push({ ...group, groupId: user._id });
    }
    res
      .status(200)
      .json({ lifeTimeData: group, monthlyData, lifeTimeLeaderData });
  } catch (error) {
    console.log(
      "error",
      "error at suiteController#################### ",
      error
    );
    res.status(500).json({ message: error.message });
  }
};

export const leaderHistoryController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request !");
    }

    let allLeader = await findUser({
      userType: "GROUP",
      isHide: false,
      isDeleted: false,
    });
    let lifeTimeLeaderData = [];
    for await (let user of allLeader) {
      let filteredPortfolio = await findPortfolio({ userId: user._id });
      const group = filteredPortfolio.reduce(
        (acc, curr) => {
          return {
            totalCapital: acc.totalCapital + curr.totalCapital,
            MDD: Math.max(acc.MDD, curr.MDD),
            ROI: acc.ROI + curr.totalROI,
            pnlValue: acc.pnlValue + curr.totalPnlValue,
            // pnlValue:
            //   acc.pnlValue +
            //     curr.pnlList.find(
            //       (e) => e.date === moment(Date.now()).format("DD/MM/YYYY")
            //     )?.pnlValue || 0,
          };
        },
        {
          totalCapital: 0,
          MDD: 0,
          ROI: 0,
          pnlValue: 0,
        }
      );
      lifeTimeLeaderData.push({ ...group, groupId: user._id });
    }

    // Get the current date and last 12 months
    const currentDate = new Date();
    const months = [];

    // Generate array of last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      const { month } = calculateMonth(date);
      months.push(month);
    }

    // Fetch portfolio data for all months
    const portfolios = await findPortfolio({
      month: { $in: months },
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
    // Group portfolios by month
    const monthlyData = months
      .map((month) => {
        const monthPortfolios = portfolios.filter((p) => p.month === month);

        // Filter for USER type portfolios
        const filteredPortfolios = monthPortfolios.filter(
          //@ts-ignore
          (portfolio) => portfolio?.userId?.userType === "USER"
        );

        // Skip months with no data
        if (filteredPortfolios.length === 0) {
          return null;
        }
        // Aggregate pnlList entries by date
        const aggregatedPnlList = filteredPortfolios.reduce(
          (acc, portfolio) => {
            portfolio.pnlList.forEach((pnlEntry) => {
              const existingEntry = acc.find(
                (entry) => entry.date === pnlEntry.date
              );

              if (existingEntry) {
                // If entry for this date exists, sum the values
                existingEntry.pnlValue += pnlEntry.pnlValue;
                existingEntry.cumulativePNL += pnlEntry.cumulativePNL;
              } else {
                // If no entry exists for this date, add a new one
                acc.push({
                  date: pnlEntry.date,
                  day: pnlEntry.day,
                  pnlValue: pnlEntry.pnlValue,
                  cumulativePNL: pnlEntry.cumulativePNL,
                });
              }
            });
            return acc;
          },
          []
        );

        // Sort pnlList by date
        aggregatedPnlList.sort((a, b) => {
          const [dayA, monthA, yearA] = a.date.split("/").map(Number);
          const [dayB, monthB, yearB] = b.date.split("/").map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA);
          const dateB = new Date(yearB, monthB - 1, dayB);
          return dateB.getTime() - dateA.getTime(); // Compare timestamps instead of Date objects
        });
        // Calculate aggregates for each month
        const monthGroup = filteredPortfolios.reduce(
          (acc, curr) => ({
            month: acc.month,
            totalCapital: acc.totalCapital + curr.totalCapital,
            MDD: Math.max(acc.MDD, curr.MDD),
            ROI: acc.ROI + curr.totalROI,
            pnlValue: acc.pnlValue + curr.totalPnlValue,
            pnlList: aggregatedPnlList,
          }),
          {
            month: month,
            totalCapital: 0,
            MDD: 0,
            ROI: 0,
            pnlValue: 0,
            pnlList: [],
          }
        );

        return monthGroup;
      })
      .filter(Boolean); // Remove null entries
    let portfolio = await findPortfolio({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
    // console.log(portfolio.length, "??????????");

    let filteredPortfolio = portfolio.filter((portfolio) => {
      // console.log(portfolio, "%%%%%%%%%%");

      // console.log(portfolio.userId, "####");

      //@ts-ignore
      if (portfolio?.userId?.userType == "USER") {
        return portfolio;
      }
    });
    // console.log(filteredPortfolio.length, "@@@@@@@@?");
    const group = filteredPortfolio.reduce(
      (acc, curr) => {
        return {
          totalCapital: acc.totalCapital + curr.totalCapital,
          MDD: Math.max(acc.MDD, curr.MDD),
          ROI: acc.ROI + curr.totalROI,
          pnlValue: acc.pnlValue + curr.totalPnlValue,
          // pnlValue:
          //   acc.pnlValue +
          //     curr.pnlList.find(
          //       (e) => e.date === moment(Date.now()).format("DD/MM/YYYY")
          //     )?.pnlValue || 0,
        };
      },
      {
        totalCapital: 0,
        MDD: 0,
        ROI: 0,
        pnlValue: 0,
      }
    );
    res.status(200).json({ lifeTimeData: group, monthlyData });
  } catch (error) {
    console.log(
      "error",
      "error at leaderHistoryController#################### ",
      error
    );
    res.status(500).json({ message: error.message });
  }
};
