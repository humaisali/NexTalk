const rateLimit = require('express-rate-limit');

// General API — 200 req/min
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' }
});

// Auth routes (login, register, logout) — 20/15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip the check-number and find-user endpoints — they are read-only
  // and need to be called many times during registration
  skip: (req) => {
    const skipPaths = ['/check-number', '/find-user'];
    return skipPaths.some((p) => req.path.endsWith(p));
  },
  message: { message: 'Too many auth attempts. Try again in 15 minutes.' }
});

// Check-number — generous: 120/min (called on every keystroke)
const checkNumberLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many number checks. Please wait a moment.' }
});

// AI routes — 30/min (protects both provider quotas)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit reached. Please wait a moment.' }
});

module.exports = { apiLimiter, authLimiter, aiLimiter, checkNumberLimiter };
