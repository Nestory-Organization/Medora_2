const env = require("../config/env");

// In-memory store for rate limiting: {userId: {count, resetTime}}
const rateLimitStore = new Map();

/**
 * Get user ID from JWT token in request
 * @param {Object} req - Express request object
 * @returns {string} - User ID from token or 'anonymous'
 */
const getUserIdFromToken = (req) => {
  try {
    if (!req.user || !req.user.id) {
      return "anonymous";
    }
    return req.user.id;
  } catch (error) {
    return "anonymous";
  }
};

/**
 * Check if user has exceeded rate limit
 * @param {string} userId - User ID
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
const checkRateLimit = (userId) => {
  const now = Date.now();
  const limit = env.aiRateLimit;
  const window = env.aiRateWindow * 1000; // Convert to milliseconds

  if (!rateLimitStore.has(userId)) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + window });
    return { allowed: true, remaining: limit - 1, resetTime: now + window };
  }

  const userLimit = rateLimitStore.get(userId);

  if (now >= userLimit.resetTime) {
    // Window has expired, reset
    rateLimitStore.set(userId, { count: 1, resetTime: now + window });
    return { allowed: true, remaining: limit - 1, resetTime: now + window };
  }

  // Within window
  if (userLimit.count >= limit) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: userLimit.resetTime,
      retryAfter,
    };
  }

  userLimit.count += 1;
  const remaining = limit - userLimit.count;
  return { allowed: true, remaining, resetTime: userLimit.resetTime };
};

/**
 * Rate limiter middleware for AI endpoints
 * Limits API requests to configured limit per hour per user
 */
const rateLimiter = (req, res, next) => {
  const userId = getUserIdFromToken(req);
  const rateLimitInfo = checkRateLimit(userId);

  // Set headers
  res.setHeader("X-RateLimit-Limit", env.aiRateLimit);
  res.setHeader("X-RateLimit-Remaining", rateLimitInfo.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(rateLimitInfo.resetTime / 1000));

  if (!rateLimitInfo.allowed) {
    res.setHeader("Retry-After", rateLimitInfo.retryAfter);

    console.warn(`Rate limit exceeded for user: ${userId}`);

    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
      retryAfter: rateLimitInfo.retryAfter,
      resetTime: new Date(rateLimitInfo.resetTime).toISOString(),
    });
  }

  next();
};

module.exports = rateLimiter;
