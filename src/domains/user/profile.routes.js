import { Router } from "express";
import { upload } from "../../utils/upload.js";

// Imports
import * as ProfileController from "./profile.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/rbacMiddleware.js";

const router = Router();

// Apply Auth Middleware globally for profile routes
router.use(protect);

// ONBOARDING ENDPOINT
router.put("/onboarding", ProfileController.submitOnboarding);

// --- STAGE 1 ---
router
  .route("/stage-1/basics")
  .get(ProfileController.getBasicInfo) // CHECK: Does data exist?
  .post(ProfileController.updateBasicInfo); // SAVE: Create or Update

router
  .route("/stage-1/identity")
  .get(ProfileController.getIdentity)
  .post(upload.single("document"), ProfileController.uploadIdentityDoc);

router
  .route("/stage-1/photos")
  .get(ProfileController.getPhotos)
  .post(
    upload.fields([{ name: "baby" }, { name: "current" }]),
    ProfileController.uploadPhotos
  );

// --- STAGE 2 ---
router
  .route("/stage-2/background")
  .get(ProfileController.getBackgroundInfo)
  .post(ProfileController.updateBackground);

// --- STAGE 3 ---
router
  .route("/stage-3/health")
  .get(ProfileController.getHealthInfo)
  .post(ProfileController.updateHealth);

// --- STAGE 4 ---
router
  .route("/stage-4/genetic")
  .get(ProfileController.getGeneticInfo)
  .post(upload.single("report"), ProfileController.updateGenetic);

// --- STAGE 5 ---
router
  .route("/stage-5/compensation")
  .get(ProfileController.getCompensationInfo)
  .post(ProfileController.updateCompensation);

// --- STAGE 6 ---
router
  .route("/stage-6/complete")
  .get(ProfileController.getLegalInfo) // Check if already agreed
  .post(ProfileController.completeProfile);

router.get("/current", ProfileController.getCurrentProfile);

// === ADMIN ROUTES ===

// 1. View Pending Profiles
router.get(
  "/admin/pending",
  requirePermission("profiles.view_pending"), // RBAC Check
  ProfileController.getPendingProfiles
);
router.patch(
  "/admin/approve/:userId",
  protect,
  requirePermission("profiles.approve"),
  ProfileController.approveProfile
);

export default router;
