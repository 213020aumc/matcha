import "dotenv/config"; // Load .env
import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 3000;

// Handle uncaught exceptions (bugs in synchronous code)
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

const startServer = async () => {
  try {
    // Check DB connection
    await prisma.$connect();
    console.log("✅ DB Connected");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

    // Handle unhandled rejections (failures in async code/Promises)
    process.on("unhandledRejection", (err) => {
      console.log("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message);
      // Close server gracefully before exiting
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
