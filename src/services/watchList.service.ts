import { IWatchList, WatchListModel } from "../models/watchList.model";

export const deleteWatchList = async (_id: string) => {
  await WatchListModel.findByIdAndDelete(_id);
};

export const getAllWatchList = async () => {
  const watchList = await WatchListModel.find();
  return watchList ? watchList.map((item) => new WatchListModel(item)) : null;
};

export const getWatchListById = async (_id: string) => {
  const watchList = await WatchListModel.findById(_id).lean();
  return watchList;
};

export const getWatchListByLeaderId = async (leaderId: string) => {
  const watchList = await WatchListModel.find({
    leaderId,
  }).populate({
    path: "userId",
    select: "firstName phoneNumber email referredBy referrals",
  });
  return watchList ? watchList : [];
};

export const getWatchListByUserId = async (userId: string) => {
  const watchList = await WatchListModel.find({
    userId,
  }).sort({ createdAt: -1 });
  return watchList ? watchList : [];
};

export const saveWatchList = async (watchList: IWatchList) => {
  const savedWatchList = await new WatchListModel(watchList).save();
  return savedWatchList;
};

export const updateWatchList = async (watchList: IWatchList) => {
  await WatchListModel.findByIdAndUpdate(watchList._id, watchList);
  return watchList;
};
