import { Response } from "express";
import { Request } from "../../request";
import { getAllUser, getPopulatedUserById } from "../../services/user.service";
import Joi from "joi";
import {
  getPortfolioByUserIdAndMonth,
  savePortfolio,
} from "../../services/portfolio.service";
import { PortfolioModel } from "../../models/portfolio.model";

export const addPNLSchema = Joi.object({
  pnl: Joi.number().required(),
  month: Joi.string().required(),
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
    const userId = req.params.id;
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
    let portfolio = await getPortfolioByUserIdAndMonth(
      userId,
      payloadValue.month
    );
    let portfolioObj = {};
    if (!portfolio) {
      portfolio = await savePortfolio(new PortfolioModel(portfolioObj));
    }
    res.status(200).json(portfolio);
  } catch (error) {
    console.log("error", "error in getAllUser", error);
    return res.status(500).json({
      message: "Something happened wrong try again after sometime",
      error: JSON.stringify(error),
    });
  }
};
