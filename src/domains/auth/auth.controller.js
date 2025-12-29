import jwt from "jsonwebtoken";
import * as AuthService from "./auth.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// --- LOGIN: Send OTP ---
export const login = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return next(new AppError("Please enter a valid email address", 400));
  }

  const result = await AuthService.initiateLogin(email);

  res.status(200).json({
    status: "success",
    message: "OTP sent to your email",
    data: {
      email: result.user.email,
    },
  });
});

// --- VERIFY OTP ---
export const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Please provide email and OTP", 400));
  }

  const user = await AuthService.verifyOtp(email, otp);

  if (!user) {
    return next(new AppError("Invalid or expired OTP", 401));
  }

  // Sign token
  const token = signToken(user.id);

  // Set cookie
  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  res.cookie("jwt", token, cookieOptions);

  // Check if user is admin (accessRole is the relation to Role model)
  const isAdmin =
    user.accessRole?.name === "Super Admin" ||
    user.accessRole?.name === "Admin" ||
    user.accessRole?.name === "Moderator";

  // Determine redirect route
  let redirectRoute = "/onboarding";

  if (isAdmin) {
    redirectRoute = "/admin";
  } else if (user.termsAccepted && user.role) {
    if (user.profileStatus === "PENDING_REVIEW") {
      redirectRoute = "/profile/pending";
    } else if (user.profileStatus === "ACTIVE") {
      redirectRoute = "/home";
    } else if (user.profileStatus === "REJECTED") {
      redirectRoute = "/profile/rejected";
    } else {
      redirectRoute = "/profile/complete";
    }
  }

  // Return response with full accessRole including permissions
  res.status(200).json({
    status: "success",
    token,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        gender: user.gender,
        serviceType: user.serviceType,
        interestedIn: user.interestedIn,
        pairingTypes: user.pairingTypes,
        profileStatus: user.profileStatus,
        onboardingStep: user.onboardingStep,
        termsAccepted: user.termsAccepted,
        accessRole: user.accessRole, // Includes { id, name, permissions: [...] }
      },
      redirectRoute,
      isAdmin,
    },
  });
});

// --- LOGOUT ---
export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};
