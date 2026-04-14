import { Router } from "express";

import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createProtectedResourceRoutes(controller) {
  const router = Router();

  router.get("/", requireAuth, asyncHandler(controller.list));
  router.get("/:id", requireAuth, asyncHandler(controller.getById));
  router.post("/", requireAuth, requireAdmin, asyncHandler(controller.create));
  router.patch("/:id", requireAuth, requireAdmin, asyncHandler(controller.update));
  router.delete("/:id", requireAuth, requireAdmin, asyncHandler(controller.remove));

  return router;
}
