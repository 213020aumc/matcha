import { Router } from "express";
import { upload } from "../../utils/upload.js";

// Imports
import * as ProfileController from "./profile.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/rbacMiddleware.js";
import { validate } from "../../utils/validate.js";
import {
  onboardingSchema,
  basicInfoSchema,
  identityDocSchema,
  photosSchema,
  backgroundSchema,
  healthSchema,
  geneticSchema,
  compensationSchema,
  completeProfileSchema,
  editProfileSchema,
  approveProfileSchema,
  userIdParamSchema,
} from "../../validations/profile.validation.js";

const router = Router();

// Apply Auth Middleware globally for profile routes
router.use(protect);

// ONBOARDING ENDPOINT
router.put(
  "/onboarding",
  validate(onboardingSchema),
  ProfileController.submitOnboarding
);

// --- STAGE 1 ---
router
  .route("/stage-1/basics")
  .get(ProfileController.getBasicInfo)
  .post(validate(basicInfoSchema), ProfileController.updateBasicInfo);

router
  .route("/stage-1/identity")
  .get(ProfileController.getIdentity)
  .post(
    upload.single("document"),
    validate(identityDocSchema),
    ProfileController.uploadIdentityDoc
  );

router
  .route("/stage-1/photos")
  .get(ProfileController.getPhotos)
  .post(
    upload.fields([{ name: "baby" }, { name: "current" }]),
    validate(photosSchema),
    ProfileController.uploadPhotos
  );

// --- STAGE 2: Background ---
router
  .route("/stage-2/background")
  .get(ProfileController.getBackgroundInfo)
  .post(validate(backgroundSchema), ProfileController.updateBackground);

// --- STAGE 3: Health ---
router
  .route("/stage-3/health")
  .get(ProfileController.getHealthInfo)
  .post(validate(healthSchema), ProfileController.updateHealth);

// --- STAGE 4: Genetic ---
router
  .route("/stage-4/genetic")
  .get(ProfileController.getGeneticInfo)
  .post(
    upload.single("geneticReport"),
    validate(geneticSchema),
    ProfileController.updateGenetic
  );

// --- STAGE 5: Compensation ---
router
  .route("/stage-5/compensation")
  .get(ProfileController.getCompensationInfo)
  .post(validate(compensationSchema), ProfileController.updateCompensation);

// --- STAGE 6: Complete ---
router
  .route("/stage-6/complete")
  .get(ProfileController.getLegalInfo)
  .post(validate(completeProfileSchema), ProfileController.completeProfile);

// --- User Profile ---
router.get("/me", ProfileController.getMe);

router.patch(
  "/edit",
  validate(editProfileSchema),
  ProfileController.updateUserProfile
);

// --- Document Editing APIs ---
router.patch(
  "/documents/identity",
  upload.single("document"),
  validate(identityDocSchema),
  ProfileController.editIdentityDoc
);

router.patch(
  "/documents/photos",
  upload.fields([{ name: "baby" }, { name: "current" }]),
  ProfileController.editPhotos
);

router.patch(
  "/documents/genetic-report",
  upload.single("geneticReport"),
  ProfileController.editGeneticReport
);

// === ADMIN ROUTES ===
router.get(
  "/admin/pending",
  requirePermission("profiles.view_pending"),
  ProfileController.getPendingProfiles
);

router.patch(
  "/admin/approve/:userId",
  requirePermission("profiles.approve"),
  validate(userIdParamSchema, "params"),
  validate(approveProfileSchema),
  ProfileController.approveProfile
);

export default router;
