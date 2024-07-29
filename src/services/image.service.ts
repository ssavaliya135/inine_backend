// import { Types } from "mongoose";
// import { Upload } from "@aws-sdk/lib-storage";
// import { S3 } from "@aws-sdk/client-s3";
// import { IImage, ImageModel } from "../models/image.model";
// import sharp from "sharp";

// interface UploadFileProps {
//   filename: string;
//   mimetype: string;
//   encoding: string;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   createReadStream: any;
// }

// /**
//  *
//  * @param file UploadFileProps
//  * @param title
//  * @param description
//  * @returns Image
//  */
// export const createAndUploadImage = async (
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   file: UploadFileProps | any,
//   title: string,
//   description: string,
//   userId: string
// ): Promise<IImage> => {
//   const s3 = new S3({
//     endpoint: process.env.S3_END_POINT,
//     region: process.env.AWS_REGION,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY,
//       secretAccessKey: process.env.AWS_SECRET_KEY,
//     },
//   });
//   const _id = new Types.ObjectId().toString();

//   const uploadedImage = await new Upload({
//     client: s3,

//     params: {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: `images/${Date.now() + "_" + _id + "_" + file.originalname}`,
//       Body: file.buffer,
//       ACL: "public-read",
//     },
//   }).done();
//   //@ts-ignore
//   const S3ImageURL = uploadedImage.Key;

//   const image = new ImageModel({
//     _id,
//     title: title,
//     imageURL: S3ImageURL,
//     description,
//     userId,
//   });
//   return await saveImage(image);
// };

// export const createAndUploadImageForAdmin = async (
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   file: UploadFileProps | any,
//   title: string,
//   description: string,
//   userId: string
// ): Promise<IImage> => {
//   const s3 = new S3({
//     endpoint: process.env.S3_END_POINT,
//     region: process.env.AWS_REGION,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY,
//       secretAccessKey: process.env.AWS_SECRET_KEY,
//     },
//   });
//   const _id = new Types.ObjectId().toString();
//   const uploadedImage = await new Upload({
//     client: s3,

//     params: {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: `images/${Date.now() + "_" + _id + "_" + file.originalname}`,
//       Body: file.buffer,
//       ACL: "public-read",
//     },
//   }).done();
//   //@ts-ignore
//   const S3ImageURL = uploadedImage.Key;
//   const thumbnailBuffer = await sharp(file.buffer)
//     .toFormat("png")
//     .jpeg({ quality: 40 })
//     .toBuffer();

//   const thumbnailImg = await new Upload({
//     client: s3,

//     params: {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: `images/${Date.now()}_${title}_thumbnail.png`,
//       Body: thumbnailBuffer,
//       ACL: "public-read",
//     },
//   }).done();
//   //@ts-ignore
//   const thumbnail = thumbnailImg.Key;

//   const image = new ImageModel({
//     _id,
//     title: title,
//     imageURL: S3ImageURL,
//     thumbnail: thumbnail,
//     description,
//     userId,
//   });
//   //here error needs to be check and to create a new interface :-/
//   //@ts-ignore
//   return await saveImage(image);
// };

// export const createAndUploadOnlyImageForAdmin = async (
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   file: UploadFileProps | any,
//   title: string,
//   description: string,
//   userId: string
// ): Promise<IImage> => {
//   const s3 = new S3({
//     endpoint: process.env.S3_END_POINT,
//     region: process.env.AWS_REGION,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY,
//       secretAccessKey: process.env.AWS_SECRET_KEY,
//     },
//   });
//   const _id = new Types.ObjectId().toString();
//   const uploadedImage = await new Upload({
//     client: s3,

//     params: {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: `images/${Date.now() + "_" + _id + "_" + file.originalname}`,
//       Body: file.buffer,
//       ACL: "public-read",
//     },
//   }).done();
//   //@ts-ignore
//   const S3ImageURL = uploadedImage.Key;
//   const image = new ImageModel({
//     _id,
//     title: title,
//     imageURL: S3ImageURL,
//     description,
//     userId,
//   });
//   //here error needs to be check and to create a new interface :-/
//   //@ts-ignore
//   return await saveImage(image);
// };

// export const deleteImage = async (imageId: string) => {
//   await ImageModel.findByIdAndDelete(imageId);
// };

// export const deleteImageFromCloud = async (key: string) => {
//   const s3 = new S3({
//     endpoint: process.env.S3_END_POINT,
//     region: process.env.AWS_REGION,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY,
//       secretAccessKey: process.env.AWS_SECRET_KEY,
//     },
//   });

//   // const params = {
//   //   Bucket: process.env.AWS_BUCKET_NAME,
//   //   Key: key,
//   // };

//   // s3.deleteObject(params, (err, data) => {
//   s3.deleteObject(
//     {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//     },
//     (err, data) => {
//       if (err) {
//         console.error(err);
//         return;
//       }
//     }
//   );
// };

// export const deleteManyImages = async (createdAt) => {
//   await ImageModel.deleteMany(createdAt);
// };

// export const getAllImage = async () => {
//   const image = await ImageModel.find();
//   return image ? image.map((item) => new ImageModel(item)) : null;
// };

// export const getImageById = async (_id: string) => {
//   const image = await ImageModel.findById(_id).lean();
//   return image ? new ImageModel(image) : null;
// };

// export const saveImage = async (image: any) => {
//   await new ImageModel(image.toJSON()).save();
//   return image;
// };
