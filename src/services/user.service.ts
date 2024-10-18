import mongoose from "mongoose";
import { IUser, UserModel } from "../models/user.model";

export const deleteUser = async (_id: string) => {
  await UserModel.findByIdAndDelete(_id);
};

export const getAllUser = async () => {
  const user = await UserModel.find({
    isRegistered: true,
    isDeleted: false,
    userType: { $ne: "ADMIN" },
  }).select("firstName phoneNumber referrals email");
  // return user ? user.map((item) => new User(item)) : null;
  return user;
};

export const getNormalUser = async () => {
  const user = await UserModel.find({
    isRegistered: true,
    isDeleted: false,
    userType: { $ne: "ADMIN" },
    $or: [{ isLeader: false }, { isLeader: { $exists: false } }],
  }).select("firstName phoneNumber referrals email");
  // return user ? user.map((item) => new User(item)) : null;
  return user;
};

export const getAllUserForNotification = async (
  page: number,
  limit: number
) => {
  const user = await UserModel.find()
    .select("FCMToken")
    .skip(page)
    .limit(limit)
    .lean();
  // return user ? user.map((item) => new User(item)) : null;
  return user;
};

export const getPopulatedUserById = async (_id: string) => {
  const user = await UserModel.findById(_id)
    .select("-password")
    .lean()
    .populate({ path: "referrals", select: "firstName phoneNumber email" });
  // return new User(omit(user, ["RESETToken"]));
  return user;
};

export const getPopulatedUserById1 = async (_id: string) => {
  const [user] = await UserModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(_id) } },
    {
      $project: {
        firstName: 1,
        userType: 1,
        phoneNumber: 1,
        isRegistered: 1,
        isDeleted: 1,
        email: 1,
        token: 1,
        isReferred: {
          $cond: {
            if: { $gt: [{ $size: { $ifNull: ["$referrals", []] } }, 0] },
            then: true,
            else: false,
          },
        },
        // isReferred: {
        //   $cond: {
        //     if: { $gt: [{ $size: "$referrals" }, 0] },
        //     then: true,
        //     else: false,
        //   },
        // },
        // referralsCount: { $size: "$referrals" },
      },
    },
  ]).exec();

  return user || null;
};

export const getUserByPhoneNumber = async (phoneNumber: string) => {
  const user = await UserModel.find({
    phoneNumber: { $regex: new RegExp(`^${phoneNumber}`) },
  });
  return user ? user : [];
};

export const getUserByPhoneNumberAndEmail = async (
  phoneNumber: string,
  email: string
) => {
  const user = await UserModel.find({
    phoneNumber: { $regex: new RegExp(`^${phoneNumber}`) },
    email,
  });
  return user ? user : [];
};

export const getUserByPhoneNumberForSchema = async (phoneNumber: string) => {
  const user = await UserModel.find({
    phoneNumber,
    isRegistered: true,
    isDeleted: false,
  });
  return user ? user : [];
};

export const getNotRegisterUserByPhoneNumber = async (phoneNumber: string) => {
  const user = await UserModel.findOne({
    phoneNumber,
    isRegistered: false,
    isDeleted: false,
  });
  return user;
};

export const getUserByName = async (firstName: string) => {
  const user = await UserModel.find({
    firstName: { $regex: new RegExp(`${firstName}`) },
  });
  return user ? user : [];
};

export const getUserByEmail = async (email: string) => {
  const user = await UserModel.findOne({
    email: { $regex: new RegExp(`^${email}$`), $options: "i" },
  });
  // return user ? new User(user) : null;
  return user ? new UserModel(user) : null;
};

export const getUserById = async (_id: string) => {
  const user = await UserModel.findById(_id).lean();
  return user ? new UserModel(user) : null;
};

export const getLeaderUser = async () => {
  const user = await UserModel.find({ isLeader: true }).lean();
  return user ? user : [];
};

export const saveUser = async (user: IUser) => {
  const savedUser = await new UserModel(user).save();
  return savedUser;
};

export const updateUser = async (user: IUser) => {
  await UserModel.findByIdAndUpdate(user._id, user);
  return user;
};
