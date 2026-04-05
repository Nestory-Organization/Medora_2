const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const env = require('../config/env');

const router = express.Router();

const proxyOptions = (target, serviceName) => ({
  target,
  changeOrigin: true,
  logLevel: 'debug',
  proxyTimeout: 10000,
  timeout: 10000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[${serviceName}] Proxying ${req.method} ${req.originalUrl} -> ${target}${req.url}`);
    console.log(`[${serviceName}] Headers:`, req.headers);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[${serviceName}] Received response status:`, proxyRes.statusCode);
  },
  onError: (err, req, res) => {
    console.error('Proxy error for ' + serviceName + ':', err.message);
    res.status(502).json({
      message: serviceName + ' service unavailable'
    });
  }
});

router.use(
  '/auth',
  createProxyMiddleware({
    ...proxyOptions(env.authServiceUrl, 'auth'),
    pathRewrite: (path) => '/auth' + path
  })
);
router.use('/patients', createProxyMiddleware(proxyOptions(env.patientServiceUrl, 'patients')));
router.use('/doctors', createProxyMiddleware(proxyOptions(env.doctorServiceUrl, 'doctors')));
router.use('/appointments', createProxyMiddleware(proxyOptions(env.appointmentServiceUrl, 'appointments')));
router.use('/payments', createProxyMiddleware(proxyOptions(env.paymentServiceUrl, 'payments')));
router.use('/notifications', createProxyMiddleware(proxyOptions(env.notificationServiceUrl, 'notifications')));
router.use('/ai', createProxyMiddleware(proxyOptions(env.aiServiceUrl, 'ai')));

module.exports = router;

