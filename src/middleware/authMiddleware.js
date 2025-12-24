import jwt from "jsonwebtoken";
import { promisify } from "util";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

export const protect = async (req, res, next) => {
  let token;

  // 1. Get token from header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  // console.log("🛑 DEBUG: Headers:", req.headers.authorization);
  // console.log("🛑 DEBUG: Extracted Token:", token);
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // console.log("🔐 VERIFYING SECRET:", process.env.JWT_SECRET);
  try {
    // 2. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // 4. Grant Access
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again!", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired! Please log in again.", 401)
      );
    }
    next(error);
  }
};
