import { Router } from "express";
import * as AuthController from "./auth.controller.js";
import { authLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

// router.post("/login", authLimiter, AuthController.login);
// router.post("/verify-otp", authLimiter, AuthController.verifyOtp);
router.post("/login", AuthController.login);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/logout", AuthController.logout);

export default router;
