import prisma from "../../config/prisma.js";
import crypto from "crypto";

export const initiateLogin = async (email) => {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.userOtp.create({
    data: { userId: user.id, otpHash, expiresAt },
  });

  return { user, otpCode };
};

export const verifyOtp = async (email, otpCode) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const otpHash = crypto.createHash("sha256").update(otpCode).digest("hex");

  const validOtp = await prisma.userOtp.findFirst({
    where: {
      userId: user.id,
      otpHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!validOtp) return null;

  await prisma.userOtp.update({
    where: { id: validOtp.id },
    data: { consumedAt: new Date() },
  });

  return user;
};
