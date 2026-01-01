import { Router } from "express";
import * as AuthController from "./auth.controller.js";
import { authLimiter } from "../../middleware/rateLimiter.js";
import { validate } from "../../utils/validate.js";
import { loginSchema, verifyOtpSchema } from "../../validations/auth.validation.js";

const router = Router();

// POST /api/v1/auth/login - Request OTP
// router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
// router.post("/verify-otp", authLimiter, validate(verifyOtpSchema), AuthController.verifyOtp);

// Without rate limiter (for development)
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/verify-otp", validate(verifyOtpSchema), AuthController.verifyOtp);
router.post("/logout", AuthController.logout);

export default router;
