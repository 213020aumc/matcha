import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import globalErrorHandler from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

// Route Imports
import authRoutes from "./domains/auth/auth.routes.js";
import profileRoutes from "./domains/user/profile.routes.js";
import settingsRoutes from "./domains/settings/settings.routes.js";
import rbacRoutes from "./domains/admin/rbac.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// APPLYING GLOBAL LIMITER to all requests starting with /api
// app.use("/api", globalLimiter);

// Global Middlewares
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// (Temporary)
// app.use((req, res, next) => {
//   req.user = { id: "PASTE_UUID_FROM_SEED_OUTPUT_HERE" };
//   next();
// });

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user/profile", profileRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/admin/rbac", rbacRoutes);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

// 404 Handler
app.all("/*splat", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
