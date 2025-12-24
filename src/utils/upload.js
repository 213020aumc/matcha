import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import path from "path";
import fs from "fs";
import { AppError } from "./AppError.js";

// const isProduction = process.env.NODE_ENV === "production";
const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_BUCKET_NAME;

// =======================================================
// 1. CONFIGURATION: S3 vs LOCAL
// =======================================================
let storage;

if (useS3) {
  // --- OPTION A: AWS S3 STORAGE ---
  console.log("☁️  AWS Credentials found: Using S3 for uploads.");

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set image/jpeg, application/pdf etc.
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Naming: folder/user-id-timestamp.ext
      // Note: req.user might be undefined if auth middleware hasn't run yet.
      // We use 'public' or specific folders if needed.
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const filename = `uploads/${file.fieldname}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    },
  });
} else {
  // --- OPTION B: LOCAL DISK STORAGE ---
  console.log("📂 No AWS Credentials: Using Local Disk Storage.");

  const uploadDir = "uploads/";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `file-${uniqueSuffix}${ext}`);
    },
  });
}

// =======================================================
// 2. SHARED FILE FILTER
// =======================================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(
      new AppError(
        "Not an allowed file type! Please upload images or PDFs only.",
        400
      ),
      false
    );
  }
};

// =======================================================
// 3. EXPORT MIDDLEWARE
// =======================================================
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

// Helper to get full URL from the file object (Handles S3 vs Local difference)
export const getFileUrl = (req, file) => {
  if (!file) return null;

  if (useS3) {
    // S3 Location URL
    return file.location;
  } else {
    // Localhost URL
    const protocol = req.protocol;
    const host = req.get("host");
    return `${protocol}://${host}/${file.path.replace(/\\/g, "/")}`; // Ensure forward slashes
  }
};
