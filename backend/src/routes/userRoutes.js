import { Router } from "express";

import {
  createUserController,
  deleteUserController,
  getUserByIdController,
  listUsersController,
  updateUserController
} from "../controllers/userController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listUsersController));
router.get("/:id", requireAuth, asyncHandler(getUserByIdController));
router.post("/", requireAuth, requireAdmin, asyncHandler(createUserController));
router.patch("/:id", requireAuth, requireAdmin, asyncHandler(updateUserController));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteUserController));

export default router;
