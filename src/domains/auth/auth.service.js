import crypto from "crypto";
import bcrypt from "bcrypt";
import prisma from "../../config/prisma.js";
import { AuthModel } from "./auth.model.js";
import { sendOtpEmail } from "../../services/emailService.js";
import { AppError } from "../../utils/AppError.js";

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const initiateLogin = async (email) => {
  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        profileStatus: "DRAFT",
        onboardingStep: 0,
      },
    });
  }

  // Generate OTP
  const otpCode = generateOtp();
  const otpHash = await bcrypt.hash(otpCode, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP
  await AuthModel.saveOtp(user.id, otpHash, expiresAt);

  // Send OTP email
  try {
    await sendOtpEmail(user.email, otpCode);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    // In development, log the OTP
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 OTP for ${email}: ${otpCode}`);
    }
  }

  // Log OTP in development
  if (process.env.NODE_ENV === "development") {
    console.log(`📧 OTP for ${email}: ${otpCode}`);
  }

  return { user, otpCode };
};

export const verifyOtp = async (email, otpCode) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      accessRole: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Get latest OTP
  const otpRecord = await AuthModel.findLatestOtp(user.id);

  if (!otpRecord) {
    throw new AppError("No OTP found. Please request a new one.", 400);
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new AppError("OTP has expired. Please request a new one.", 400);
  }

  if (otpRecord.isConsumed) {
    throw new AppError("OTP already used. Please request a new one.", 400);
  }

  // Verify OTP
  const isValid = await bcrypt.compare(otpCode, otpRecord.otpHash);

  if (!isValid) {
    throw new AppError("Invalid OTP", 401);
  }

  // Mark OTP as consumed
  await AuthModel.markOtpConsumed(otpRecord.id);

  return user;
};
