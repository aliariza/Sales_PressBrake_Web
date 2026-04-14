import { Router } from "express";

import {
  createQuoteController,
  deleteQuoteController,
  downloadQuotePdfController,
  getQuoteByIdController,
  listQuotesController
} from "../controllers/quoteController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listQuotesController));
router.get("/:id", requireAuth, asyncHandler(getQuoteByIdController));
router.get("/:id/pdf", requireAuth, asyncHandler(downloadQuotePdfController));
router.post("/", requireAuth, asyncHandler(createQuoteController));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteQuoteController));

export default router;
