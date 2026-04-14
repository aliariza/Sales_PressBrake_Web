import { Router } from "express";

import { recommendController } from "../controllers/recommendationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", requireAuth, asyncHandler(recommendController));

export default router;
