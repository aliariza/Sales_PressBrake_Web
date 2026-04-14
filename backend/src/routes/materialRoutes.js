import { Router } from "express";

import {
  createMaterialController,
  deleteMaterialController,
  getMaterialByIdController,
  listMaterialsController,
  updateMaterialController
} from "../controllers/materialController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listMaterialsController));
router.get("/:id", requireAuth, asyncHandler(getMaterialByIdController));
router.post("/", requireAuth, requireAdmin, asyncHandler(createMaterialController));
router.patch("/:id", requireAuth, requireAdmin, asyncHandler(updateMaterialController));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteMaterialController));

export default router;
