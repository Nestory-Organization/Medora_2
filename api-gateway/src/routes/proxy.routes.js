const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const env = require("../config/env");

const router = express.Router();

// GET /api — base URL has no proxied handler; avoids "Gateway route not found" in clients.
router.get('/', (req, res) => {
  res.json({
    message: 'Medora API gateway',
    health: `${req.protocol}://${req.get('host')}/health`,
    routes: [
      '/api/auth',
      '/api/admin',
      '/api/patients',
      '/api/doctors',
      '/api/appointments',
      '/api/payments',
      '/api/notifications',
      '/api/ai'
    ]
  });
});

const proxyOptions = (target, serviceName) => ({
  target,
  changeOrigin: true,
  logLevel: "debug",
  onProxyReq: (proxyReq, req, res) => {
    console.log(
      `[Proxy] ${req.method} ${req.originalUrl} -> ${target}${req.url}`,
    );
    console.log(`[Proxy] Authorization header:`, req.headers.authorization ? 'Present' : 'Missing');
    
    // Ensure Authorization header is forwarded
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
      console.log(`[Proxy] Set Authorization header on proxy request`);
    }
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
    pathRewrite: (path) => `/auth${path}`,
  }),
);

router.use(
  "/patients",
  createProxyMiddleware({
    ...proxyOptions(env.patientServiceUrl, "patients"),
    pathRewrite: (path) => `/api/patients${path}`,
  }),
);

router.use(
  "/doctors",
  createProxyMiddleware({
    ...proxyOptions(env.doctorServiceUrl, "doctors"),
    pathRewrite: (path) => {
      // Remove the "/doctors" prefix since it's already been matched by the router
      const newPath = path.startsWith('/doctors') ? path.slice(8) : path;
      console.log(`[DOCTORS PROXY] Original: ${path}, Rewritten: /doctor${newPath}`);
      return `/doctor${newPath}`;
    },
  }),
);

router.use(
  "/appointments",
  createProxyMiddleware({
    ...proxyOptions(env.appointmentServiceUrl, "appointments"),
    pathRewrite: (path) => `/appointments${path}`,
  }),
);
router.use(
  "/payments",
  createProxyMiddleware({
    ...proxyOptions(env.paymentServiceUrl, "payments"),
    pathRewrite: (path) => {
      if (path.includes('/webhook')) {
        return '/webhook';
      }
      return `/payment${path}`;
    },
  }),
);
router.use(
  "/notifications",
  createProxyMiddleware(
    proxyOptions(env.notificationServiceUrl, "notifications"),
  ),
);
router.use(
  "/ai",
  createProxyMiddleware({
    ...proxyOptions(env.aiServiceUrl, "ai"),
    pathRewrite: (path) => `/api/ai${path}`,
  }),
);

router.use(
  "/admin",
  createProxyMiddleware({
    ...proxyOptions(env.adminServiceUrl, "admin"),
    pathRewrite: (path) => `/admin${path}`,
  }),
);

module.exports = router;
