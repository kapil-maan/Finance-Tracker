const rateLimit = require('express-rate-limit');

/**
 * Custom rate limiters configured to match project specifications
 */

// Auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    retryAfterMinutes: 15,
  },
});

// Transaction endpoints: 100 requests per hour
const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Transaction request limit reached (100 req/hr). Please try again later.',
  },
});

// Analytics endpoints: 50 requests per hour
const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Analytics request limit reached (50 req/hr). Please try again later.',
  },
});

module.exports = {
  authLimiter,
  transactionLimiter,
  analyticsLimiter,
};
