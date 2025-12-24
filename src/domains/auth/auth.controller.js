import jwt from "jsonwebtoken";
import * as AuthService from "./auth.service.js";
import { EmailService } from "../../services/emailService.js";
import catchAsync from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";

const signToken = (id) => {
  // console.log("🔐 SIGNING SECRET:", process.env.JWT_SECRET);
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

export const login = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return next(new AppError("Please enter a valid email address", 400));
  }

  const { user, otpCode } = await AuthService.initiateLogin(email);

  try {
    await new EmailService(user).sendOTP(otpCode);
  } catch (err) {
    console.error("Email send failed:", err);
  }

  if (process.env.NODE_ENV === "development")
    console.log(`DEV OTP: ${otpCode}`);

  res.status(200).json({
    status: "success",
    message: "OTP sent successfully",
    email: user.email,
  });
});

export const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await AuthService.verifyOtp(email, otp);

  if (!user) return next(new AppError("Incorrect OTP", 401));

  const token = signToken(user.id);

  // 1. COOKIES
  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  res.cookie("jwt", token, cookieOptions);

  // 2. STRICT ROUTING LOGIC
  let redirectRoute = "/onboarding"; // Default: User is new

  if (user.role) {
    // If user has a role, they have passed initial onboarding
    if (user.profileStatus === "ACTIVE") {
      // Only ACTIVE users go to Home
      redirectRoute = "/home";
    } else if (user.profileStatus === "PENDING_REVIEW") {
      // Waiting for Admin approval
      redirectRoute = "/profile/pending";
    } else if (user.profileStatus === "REJECTED") {
      // Rejected by Admin
      redirectRoute = "/profile/rejected";
    } else {
      // Status is DRAFT (or null) -> Finish Profile
      redirectRoute = "/profile/complete";
    }
  }

  res.status(200).json({
    status: "success",
    token,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileStatus: user.profileStatus,
      },
      redirectRoute, // Frontend uses this to navigate
    },
  });
});

export const logout = (req, res) => {
  // Overwrite the cookie with dummy data and a short expiration
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true,
    // Ensure these match your login cookie settings exactly
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully" });
};
