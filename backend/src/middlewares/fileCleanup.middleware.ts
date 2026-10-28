import fs from "fs";
import { Request } from "express";

/**
 * Automatically purges any files uploaded during this request if an error occurred,
 * preventing orphan files from accumulating on server disk.
 */
export const cleanupUploadedFiles = (req: Request): void => {
  try {
    // Single file upload (req.file)
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Multiple file uploads (req.files as array)
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    // Multiple file uploads (req.files as object with field keys)
    if (req.files && !Array.isArray(req.files) && typeof req.files === "object") {
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
      });
    }
  } catch (err) {
    console.error("Warning: Failed to clean up orphan uploaded files:", err);
  }
};

