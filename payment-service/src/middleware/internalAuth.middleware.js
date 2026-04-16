const env = require('../config/env');

function requireInternalKey(req, res, next) {
  const key = req.headers['x-internal-key'];
  if (!env.internalApiKey || key !== env.internalApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  next();
}

module.exports = { requireInternalKey };
