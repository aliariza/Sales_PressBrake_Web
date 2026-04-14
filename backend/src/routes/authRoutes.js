import { Router } from "express";

import { loginController, meController } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", asyncHandler(loginController));
router.get("/me", requireAuth, asyncHandler(meController));

export default router;
