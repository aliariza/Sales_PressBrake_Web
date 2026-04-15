import dotenv from "dotenv";

dotenv.config();

const rawCorsOrigins = process.env.CORS_ORIGIN || "http://localhost:5173";

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "replace-me",
  corsOrigins: rawCorsOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};
