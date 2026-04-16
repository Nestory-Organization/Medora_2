const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
const env = require("./config/env");
const proxyRoutes = require("./routes/proxy.routes");
const { getGatewayHealth } = require("./controllers/health.controller");

const app = express();

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(globalRateLimiter);

app.use(
  "/api/admin",
  createProxyMiddleware({
    target: env.adminServiceUrl,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: (path) => `/admin${path}`,
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[Proxy] ${req.method} ${req.originalUrl} -> ${env.adminServiceUrl}${req.url}`,
      );
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] admin:`, err.message);
      res.status(502).json({
        message: "Error connecting to admin",
        error: err.message,
      });
    },
  }),
);

// Health endpoint (no body needed)
app.get("/health", getGatewayHealth);

// Proxy routes - no body parsing, let downstream services handle it
app.use(
  "/api",
  (req, res, next) => {
    console.log("Incoming request to Gateway:", req.method, req.url);
    next();
  },
  proxyRoutes,
);

app.use((req, res) => {
  res.status(404).json({
    message: "Gateway route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Gateway error:", err);
  res.status(500).json({
    message: "Gateway internal server error",
  });
});

module.exports = app;
