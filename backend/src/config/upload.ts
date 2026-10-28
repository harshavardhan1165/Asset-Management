import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { AppError } from "../utils/AppError";
import { env } from "./env";

// 1. Detect if Cloudinary credentials are provided
export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️  Storage Engine: Cloudinary CDN (Cloud Storage Active)");
} else {
  console.log("📁 Storage Engine: Local Disk Storage (backend/uploads)");
}

// 2. Ensure local destination directories exist (used when Cloudinary is not active)
const uploadDirs = {
  products: path.resolve(__dirname, "../../uploads/products"),
  documents: path.resolve(__dirname, "../../uploads/documents"),
  handovers: path.resolve(__dirname, "../../uploads/handover-photos"),
};

if (!isCloudinaryConfigured) {
  Object.values(uploadDirs).forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// 3. Local disk storage engine
const createDiskStorage = (destinationDir: string, prefix: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destinationDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    },
  });

// 4. Cloudinary storage engine
const createCloudinaryStorage = (folder: string) =>
  new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder: `assetflow/${folder}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image",
    }),
  });

// 5. Select active storage engine for each resource
const getStorage = (type: "products" | "documents" | "handovers", prefix: string) => {
  if (isCloudinaryConfigured) {
    return createCloudinaryStorage(type);
  }
  return createDiskStorage(uploadDirs[type], prefix);
};

// Image filter (JPEG, PNG, WEBP)
const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files (.jpg, .jpeg, .png, .webp) are allowed", 400));
  }
};

// Document filter (PDF, JPEG, PNG)
const documentFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only PDF or image files are allowed for supporting documents", 400));
  }
};

// Multer upload instances
export const uploadProductImage = multer({
  storage: getStorage("products", "product"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

export const uploadSupportingDoc = multer({
  storage: getStorage("documents", "doc"),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

export const uploadHandoverPhotos = multer({
  storage: getStorage("handovers", "handover"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per photo
});
