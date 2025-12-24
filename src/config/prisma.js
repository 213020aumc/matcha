import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// Import from the custom generated path
import pkg from "../generated/prisma/index.js";

const { Pool } = pg;
// Destructure the Client and ALL Enums you need
const { PrismaClient, Role, GenderIdentity, GameteType, PlanStatus } = pkg;

// Setup the Driver Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Initialize the Client
const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

//log: ["query", "info", "warn", "error"],

// Export default instance
export default prisma;

// Export Enums and the pool (useful for scripts that need to close the connection)
export { Role, GenderIdentity, GameteType, PlanStatus, pool };
