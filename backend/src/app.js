import cors from "cors";
import express from "express";
import morgan from "morgan";

import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import machineRoutes from "./routes/machineRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import optionRoutes from "./routes/optionRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import toolingRoutes from "./routes/toolingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { env } from "./config/env.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/toolings", toolingRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.use(errorHandler);

export default app;
