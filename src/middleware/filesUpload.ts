// import multer from "multer";
// import { Request, Response, NextFunction } from "express";

// const storage = multer.memoryStorage(); // Store files in memory instead of on disk

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
//   },
// });

// export const filesUpload = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   upload.array("file", 20)(req, res, async (err) => {
//     if (err) {
//       return next(err);
//     }
//     // const files = req.files.map((file) => ({
//     //   fieldname: file.fieldname,
//     //   originalname: file.originalname,
//     //   encoding: file.encoding,
//     //   mimeType: file.mimetype,
//     //   buffer: file.buffer, // Get the buffer of the file
//     //   size: file.size,
//     //   filename: file.originalname,
//     // }));

//     req.body = req.body || {};
//     req.body.files = req.files;
//     next();
//   });
// };
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the directory exists
const uploadDir = "public/images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Directory to save the uploaded images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Generate unique filename
  },
});

// Set up file filter to allow only specific types (e.g., images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

// Initialize multer with storage and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});

module.exports = upload;
