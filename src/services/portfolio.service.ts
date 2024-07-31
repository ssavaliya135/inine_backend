import { IPortfolio, PortfolioModel } from "../models/portfolio.model";

export const deletePortfolio = async (_id: string) => {
  await PortfolioModel.findByIdAndDelete(_id);
};

export const getAllPortfolio = async () => {
  const portfolio = await PortfolioModel.find();
  return portfolio ? portfolio.map((item) => new PortfolioModel(item)) : null;
};

export const getPortfolioById = async (_id: string) => {
  const portfolio = await PortfolioModel.findById(_id).lean();
  return portfolio;
};

export const getPortfolioByUserIdAndMonth = async (
  userId: string,
  month: string
) => {
  const portfolio = await PortfolioModel.findOne({
    userId,
    month,
  });
  return portfolio ? portfolio : null;
};

export const getPortfolioByUserId = async (userId: string) => {
  const portfolio = await PortfolioModel.find({
    userId,
  });
  return portfolio ? portfolio : [];
};

export const savePortfolio = async (portfolio: IPortfolio) => {
  const savedPortfolio = await new PortfolioModel(portfolio).save();
  return savedPortfolio;
};

export const updatePortfolio = async (portfolio: IPortfolio) => {
  await PortfolioModel.findByIdAndUpdate(portfolio._id, portfolio);
  return portfolio;
};
