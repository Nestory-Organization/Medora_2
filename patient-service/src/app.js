const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
const systemRoutes = require("./routes/system.routes");
const patientRoutes = require("./routes/patient.routes");
const { uploadDir } = require("./config/storage");

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

app.use("/uploads/medical-documents", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Disposition, Content-Type",
  );
  next();
});

app.use("/uploads/medical-documents", express.static(path.resolve(uploadDir)));

app.use("/", systemRoutes);
app.use("/api/patients", patientRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File size exceeds the 10MB limit",
    });
  }

  if (err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload validation failed",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

module.exports = app;
