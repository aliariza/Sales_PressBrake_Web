import { Router } from "express";

import {
  createToolingController,
  deleteToolingController,
  getToolingByIdController,
  listToolingsController,
  updateToolingController
} from "../controllers/toolingController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listToolingsController));
router.get("/:id", requireAuth, asyncHandler(getToolingByIdController));
router.post("/", requireAuth, requireAdmin, asyncHandler(createToolingController));
router.patch("/:id", requireAuth, requireAdmin, asyncHandler(updateToolingController));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteToolingController));

export default router;
