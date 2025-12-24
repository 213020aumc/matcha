import prisma from "../../config/prisma.js";

export class AuthModel {
  static async saveOtp(userId, otpHash, expiresAt) {
    return await prisma.userOtp.create({
      data: {
        userId,
        otpHash,
        expiresAt,
      },
    });
  }

  static async findLatestOtp(userId) {
    return await prisma.userOtp.findFirst({
      where: { userId, consumedAt: null },
      orderBy: { id: "desc" },
    });
  }

  static async markOtpConsumed(id) {
    return await prisma.userOtp.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}
