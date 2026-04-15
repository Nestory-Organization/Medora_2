const dotenv = require("dotenv");

dotenv.config();

const requiredVars = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "GOOGLE_GEMINI_API_KEY",
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error("Missing required environment variable: " + key);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGO_URI,
  serviceName: process.env.SERVICE_NAME || "ai-service",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  aiRateLimit: Number(process.env.AI_RATE_LIMIT) || 5,
  aiRateWindow: Number(process.env.AI_RATE_WINDOW) || 3600,
};
