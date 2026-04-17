const jwt = require('jsonwebtoken');
const env = require('../config/env');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    console.log('[Auth Middleware] Authorization header:', authHeader ? 'Present' : 'Missing');
    console.log('[Auth Middleware] Token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.warn('[Auth Middleware] Token missing');
      return res.status(401).json({
        success: false,
        message: 'Authorization token is missing'
      });
    }

    console.log('[Auth Middleware] JWT Secret available:', !!env.jwtSecret);
    const decoded = jwt.verify(token, env.jwtSecret);
    console.log('[Auth Middleware] Token decoded:', { id: decoded.id, email: decoded.email, role: decoded.role });
    req.user = decoded;
    console.log('[Auth Middleware] req.user set:', req.user);
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'User does not have permission to access this resource'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
