import { Response } from "express";
import { Request } from "../request";
import { getPortfolioByUserId } from "../services/portfolio.service";

export const getPortfolioController = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser;
    if (!authUser) {
      return res.status(403).json("unauthorized request");
    }
    let portfolio = await getPortfolioByUserId(authUser._id);
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
