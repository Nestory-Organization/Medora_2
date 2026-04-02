const multer = require("multer");
const path = require("path");
const {
  uploadDir,
  ensureUploadDir,
  validateFile,
  maxFileSize,
} = require("../config/storage");

ensureUploadDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const validation = validateFile(file);

  if (!validation.isValid) {
    const error = new Error(validation.message);
    error.statusCode = 400;
    return cb(error);
  }

  return cb(null, true);
};

const uploadMedicalDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
}).single("file");

const handleFileUpload = (req, res, next) => {
  uploadMedicalDocument(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "File size exceeds the 10MB limit",
        });
      }

      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }

    if (req.file) {
      req.fileMetadata = {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        filename: req.file.filename,
      };
    }

    return next();
  });
};

module.exports = {
  handleFileUpload,
};
