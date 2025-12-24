import rateLimit from "express-rate-limit";

// 1. GLOBAL LIMITER (Applied to all routes)
// Allow 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      status: "fail",
      message: options.message,
    });
  },
});

// 2. AUTH LIMITER (Applied to Login/OTP)
// Stricter: Allow only 5 login attempts per 10 minutes
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts. Please try again after 10 minutes.",
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      status: "fail",
      message: options.message,
    });
  },
});
