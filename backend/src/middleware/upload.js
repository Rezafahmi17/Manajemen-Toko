import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = path.join(process.cwd(), "uploads", "products");

// Buat folder otomatis jika belum ada
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + extension;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Foto harus berformat JPG, PNG, atau WEBP."), false);
  }

  cb(null, true);
};

export const uploadProduct = multer({
  storage,

  limits: {
    // Maksimal 5 MB
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});
