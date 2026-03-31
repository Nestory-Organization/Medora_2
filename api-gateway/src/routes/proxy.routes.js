const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const env = require('../config/env');

const router = express.Router();

const proxyOptions = (target, pathPrefix) => ({
  target,
  changeOrigin: true,
  pathRewrite: {
    ['^' + pathPrefix]: ''
  },
  proxyTimeout: 10000,
  timeout: 10000,
  onError: (err, req, res) => {
    console.error('Proxy error for ' + pathPrefix + ':', err.message);
    res.status(502).json({
      message: pathPrefix + ' service unavailable'
    });
  }
});

router.use('/auth', createProxyMiddleware(proxyOptions(env.authServiceUrl, '/auth')));
router.use('/patients', createProxyMiddleware(proxyOptions(env.patientServiceUrl, '/patients')));
router.use('/doctors', createProxyMiddleware(proxyOptions(env.doctorServiceUrl, '/doctors')));
router.use('/appointments', createProxyMiddleware(proxyOptions(env.appointmentServiceUrl, '/appointments')));
router.use('/payments', createProxyMiddleware(proxyOptions(env.paymentServiceUrl, '/payments')));
router.use('/notifications', createProxyMiddleware(proxyOptions(env.notificationServiceUrl, '/notifications')));
router.use('/ai', createProxyMiddleware(proxyOptions(env.aiServiceUrl, '/ai')));

module.exports = router;

