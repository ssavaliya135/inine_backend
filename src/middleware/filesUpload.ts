import multer from "multer";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage(); // Store files in memory instead of on disk

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
});

export const filesUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.array("file", 20)(req, res, async (err) => {
    if (err) {
      return next(err);
    }
    // const files = req.files.map((file) => ({
    //   fieldname: file.fieldname,
    //   originalname: file.originalname,
    //   encoding: file.encoding,
    //   mimeType: file.mimetype,
    //   buffer: file.buffer, // Get the buffer of the file
    //   size: file.size,
    //   filename: file.originalname,
    // }));

    req.body = req.body || {};
    req.body.files = req.files;
    next();
  });
};
