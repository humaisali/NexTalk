const rateLimit = require('express-rate-limit');

// General API rate limiter — 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' }
});

// Auth routes — stricter: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts. Try again in 15 minutes.' }
});

// AI routes — Gemini calls are expensive: 30 per minute
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit reached. Please wait a moment.' }
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
