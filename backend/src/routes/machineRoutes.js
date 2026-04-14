import { Router } from "express";

import {
  createMachineController,
  deleteMachineController,
  getMachineByIdController,
  listMachinesController,
  updateMachineController
} from "../controllers/machineController.js";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listMachinesController));
router.get("/:id", requireAuth, asyncHandler(getMachineByIdController));
router.post("/", requireAuth, requireAdmin, asyncHandler(createMachineController));
router.patch("/:id", requireAuth, requireAdmin, asyncHandler(updateMachineController));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteMachineController));

export default router;
