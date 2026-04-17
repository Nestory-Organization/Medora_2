const dotenv = require("dotenv");

dotenv.config();

const defaultNotificationServiceUrl =
  process.env.NODE_ENV === "production"
    ? "http://notification-service:4006"
    : "http://localhost:4006";

const requiredVars = ["PORT", "MONGO_URI"];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error("Missing required environment variable: " + key);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGO_URI,
  serviceName: process.env.SERVICE_NAME || "appointment-service",
  doctorSearchSource: process.env.DOCTOR_SEARCH_SOURCE || "http",
  doctorServiceUrl:
    process.env.DOCTOR_SERVICE_URL || "http://doctor-service:4003",
  patientServiceUrl:
    process.env.PATIENT_SERVICE_URL || "http://patient-service:4002",
  jwtSecret:
    process.env.JWT_SECRET || "change_this_auth_jwt_secret_in_production",
};
