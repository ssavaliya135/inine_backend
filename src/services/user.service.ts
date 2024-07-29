import { IUser, UserModel } from "../models/user.model";

export const deleteUser = async (_id: string) => {
  await UserModel.findByIdAndDelete(_id);
};

export const getAllUser = async () => {
  const user = await UserModel.find().select("firstName lastName email");
  // return user ? user.map((item) => new User(item)) : null;
  return user ? user.map((item) => new UserModel(item)) : null;
};

export const getPopulatedUserById = async (_id: string) => {
  const user = await UserModel.findById(_id).select("-password").lean();
  // return new User(omit(user, ["RESETToken"]));
  return user;
};

export const getUserByPhoneNumber = async (phoneNumber: string) => {
  const user = await UserModel.findOne({
    phoneNumber,
  });
  return user ? user : null;
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

export const saveUser = async (user: IUser) => {
  const savedUser = await new UserModel(user.toJSON()).save();
  return savedUser;
};

export const updateUser = async (user: IUser) => {
  await UserModel.findByIdAndUpdate(user._id, user.toJSON());
  return user;
};
