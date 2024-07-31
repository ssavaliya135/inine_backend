import { IAmount, AmountModel } from "../models/amount.model";

export const deleteAmount = async (_id: string) => {
  await AmountModel.findByIdAndDelete(_id);
};

export const getAllAmount = async () => {
  const amount = await AmountModel.find();
  return amount ? amount.map((item) => new AmountModel(item)) : null;
};

export const getAmountById = async (_id: string) => {
  const amount = await AmountModel.findById(_id).lean();
  return amount;
};

export const getAmountByUserIdAndMonth = async (
  userId: string,
  month: string
) => {
  const amount = await AmountModel.findOne({
    userId,
    month,
  });
  return amount ? amount : null;
};

export const getAmountByUserId = async (userId: string) => {
  const amount = await AmountModel.find({
    userId,
  });
  return amount ? amount : [];
};

export const saveAmount = async (amount: IAmount) => {
  const savedAmount = await new AmountModel(amount).save();
  return savedAmount;
};

export const updateAmount = async (amount: IAmount) => {
  await AmountModel.findByIdAndUpdate(amount._id, amount);
  return amount;
};
