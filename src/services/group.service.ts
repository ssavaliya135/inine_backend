import { IGroup, GroupModel } from "../models/group.model";

export const deleteGroup = async (_id: string) => {
  await GroupModel.findByIdAndDelete(_id);
};

export const getAllGroup = async () => {
  const group = await GroupModel.find();
  return group ? group.map((item) => new GroupModel(item)) : null;
};

export const getGroupById = async (_id: string) => {
  const group = await GroupModel.findById(_id).lean();
  return group;
};

export const getPopulatedGroupById = async (_id: string) => {
  const group = await GroupModel.findById(_id).lean().populate({
    path: "userId",
  });
  return group;
};

export const getGroupByUserIdAndMonth = async (
  userId: string,
  month: string
) => {
  const group = await GroupModel.findOne({
    userId,
    month,
  });
  return group ? group : null;
};

export const getGroupByUserId = async (userId: string) => {
  const group = await GroupModel.find({
    userId,
  }).sort({ createdAt: -1 });
  return group ? group : [];
};

export const saveGroup = async (group: IGroup) => {
  const savedGroup = await new GroupModel(group).save();
  return savedGroup;
};

export const updateGroup = async (group: IGroup) => {
  await GroupModel.findByIdAndUpdate(group._id, group);
  return group;
};
