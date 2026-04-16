const fs = require("fs");
const path = require("path");

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR ||
    path.join(process.cwd(), "uploads", "medical-documents"),
);

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const maxFileSize = Number(process.env.MAX_FILE_SIZE || 10485760);

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const validateFile = (file) => {
  if (!file) {
    return { isValid: false, message: "File is required" };
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      message: "Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX",
    };
  }

  if (file.size > maxFileSize) {
    return { isValid: false, message: "File size exceeds the 10MB limit" };
  }

  return { isValid: true };
};

module.exports = {
  uploadDir,
  allowedMimeTypes,
  maxFileSize,
  ensureUploadDir,
  validateFile,
};
