import { AppError } from "../utils/AppError.js";

const handleJoiValidationError = (err) => {
  const message = err.details.map((d) => d.message).join(", ");
  return new AppError(message, 400);
};

const handlePrismaError = (err) => {
  // Unique constraint violation
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return new AppError(`A record with this ${field} already exists`, 400);
  }
  // Record not found
  if (err.code === "P2025") {
    return new AppError("Record not found", 404);
  }
  // Foreign key constraint
  if (err.code === "P2003") {
    return new AppError("Related record not found", 400);
  }
  return new AppError("Database error", 500);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your session has expired. Please log in again.", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Joi validation error
    if (err.isJoi || err.name === "ValidationError") {
      error = handleJoiValidationError(err);
    }

    // Prisma errors
    if (err.code?.startsWith("P")) {
      error = handlePrismaError(err);
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

export default errorHandler;
