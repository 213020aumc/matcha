import { Router } from "express";
import * as SettingsController from "./settings.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/rbacMiddleware.js";
import { validate } from "../../utils/validate.js";
import { updateSettingsSchema } from "../../validations/settings.validation.js";

const router = Router();

// Protect all settings routes (User must be logged in)
router.use(protect);

// Ideally, restrict to ADMIN only:
// router.use(restrictTo('ADMIN'));

router.get(
  "/",
  requirePermission("settings.view"),
  SettingsController.getSettings
); // GET All
router.put(
  "/",
  requirePermission("settings.manage"),
  validate(updateSettingsSchema),
  SettingsController.updateSettings
); // CREATE / UPDATE Bulk
router.delete(
  "/:key",
  requirePermission("settings.manage"),
  SettingsController.deleteSetting
); // DELETE Single

export default router;
