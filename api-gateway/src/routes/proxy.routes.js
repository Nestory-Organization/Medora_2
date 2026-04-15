const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const env = require("../config/env");

const router = express.Router();

const proxyOptions = (target, serviceName) => ({
  target,
  changeOrigin: true,
  logLevel: "debug",
  onProxyReq: (proxyReq, req, res) => {
    console.log(
      `[Proxy] ${req.method} ${req.originalUrl} -> ${target}${req.url}`,
    );
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${serviceName}:`, err.message);
    res.status(502).json({
      message: `Error connecting to ${serviceName}`,
      error: err.message,
    });
  },
});

router.use(
  "/auth",
  createProxyMiddleware({
    ...proxyOptions(env.authServiceUrl, "auth"),
    pathRewrite: { "^/api/auth": "/api/auth" },
  }),
);

router.use(
  "/patients",
  createProxyMiddleware({
    ...proxyOptions(env.patientServiceUrl, "patients"),
    pathRewrite: { "^/api/patients": "/api/patients" },
  }),
);

router.use(
  "/doctors",
  createProxyMiddleware({
    ...proxyOptions(env.doctorServiceUrl, "doctors"),
    pathRewrite: { "^/api/doctors": "/api/doctors" },
  }),
);

router.use(
  "/appointments",
  createProxyMiddleware({
    ...proxyOptions(env.appointmentServiceUrl, "appointments"),
    pathRewrite: { "^/api/appointments": "/api/appointments" },
  }),
);
router.use(
  "/payments",
  createProxyMiddleware(proxyOptions(env.paymentServiceUrl, "payments")),
);
router.use(
  "/notifications",
  createProxyMiddleware(
    proxyOptions(env.notificationServiceUrl, "notifications"),
  ),
);
router.use("/ai", createProxyMiddleware(proxyOptions(env.aiServiceUrl, "ai")));

module.exports = router;
