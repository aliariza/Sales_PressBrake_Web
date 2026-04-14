import { Router } from "express";

import {
  createOptionController,
  deleteOptionController,
  getOptionByIdController,
  listOptionsController,
  updateOptionController
} from "../controllers/optionController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listOptionsController));
router.get("/:id", requireAuth, asyncHandler(getOptionByIdController));
router.post("/", requireAuth, requireAdmin, asyncHandler(createOptionController));
router.patch("/:id", requireAuth, requireAdmin, asyncHandler(updateOptionController));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteOptionController));

export default router;
