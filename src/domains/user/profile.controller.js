import * as ProfileService from "./profile.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { getFileUrl } from "../../utils/upload.js";

export const submitOnboarding = catchAsync(async (req, res, next) => {
  // Use data from Body, use ID from JWT (req.user)
  const result = await ProfileService.updateOnboardingData(
    req.user.id,
    req.body
  );

  res.status(200).json({
    status: "success",
    data: {
      user: result,
      nextStep: "PROFILE_COMPLETION", // Frontend signal
    },
  });
});

// --- STAGE 1 ---
export const updateBasicInfo = catchAsync(async (req, res, next) => {
  const result = await ProfileService.upsertBasicInfo(req.user.id, req.body);
  res.status(200).json({ status: "success", data: result });
});

export const uploadIdentityDoc = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No document file provided", 400));
  }

  // Helper handles S3 vs Local logic automatically
  const fileUrl = getFileUrl(req, req.file);

  const result = await ProfileService.saveIdentityDoc(
    req.user.id,
    req.body.type,
    fileUrl
  );
  res.status(200).json({ status: "success", data: result });
});

export const uploadPhotos = catchAsync(async (req, res, next) => {
  const photoUrls = {};

  // Helper handles S3 vs Local logic automatically
  if (req.files?.["baby"]?.[0]) {
    photoUrls.babyPhotoUrl = getFileUrl(req, req.files["baby"][0]);
  }
  if (req.files?.["current"]?.[0]) {
    photoUrls.currentPhotoUrl = getFileUrl(req, req.files["current"][0]);
  }

  const result = await ProfileService.updateProfilePhotos(
    req.user.id,
    photoUrls
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 2 ---
export const updateBackground = catchAsync(async (req, res, next) => {
  const result = await ProfileService.updateBackgroundInfo(
    req.user.id,
    req.body
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 3 ---
export const updateHealth = catchAsync(async (req, res, next) => {
  const result = await ProfileService.updateHealthHistory(
    req.user.id,
    req.body
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 4 ---
export const updateGenetic = catchAsync(async (req, res, next) => {
  const fileUrl = req.file ? getFileUrl(req, req.file) : null;

  const result = await ProfileService.updateGeneticProfile(
    req.user.id,
    req.body.conditions,
    fileUrl
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 5 ---
export const updateCompensation = catchAsync(async (req, res, next) => {
  if (req.body.allowBidding === "true" && !req.body.minAccepted) {
    return next(
      new AppError(
        "Minimum accepted price is required when bidding is allowed",
        400
      )
    );
  }
  const result = await ProfileService.upsertCompensation(req.user.id, req.body);
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 6 ---
export const completeProfile = catchAsync(async (req, res, next) => {
  const { consentAgreed, anonymityPreference } = req.body;

  if (!consentAgreed) {
    return next(new AppError("You must agree to the consent form", 400));
  }

  const result = await ProfileService.completeLegalAgreements(
    req.user.id,
    consentAgreed,
    anonymityPreference
  );
  res.status(200).json({
    status: "success",
    message: "Profile completion submitted for review",
  });
});

// GET /admin/pending
export const getPendingProfiles = catchAsync(async (req, res) => {
  const users = await ProfileService.getPendingProfiles();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

// PATCH /admin/approve/:userId
export const approveProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { status, reason } = req.body; // Expect "ACTIVE" or "REJECTED"

  // 1. Validation
  const ALLOWED_STATUSES = ["ACTIVE", "REJECTED"];
  if (!ALLOWED_STATUSES.includes(status)) {
    return next(new AppError("Status must be either ACTIVE or REJECTED", 400));
  }

  if (status === "REJECTED" && !reason) {
    return next(
      new AppError("Rejection reason is required when rejecting a profile", 400)
    );
  }

  // 2. Call Service
  const updatedUser = await ProfileService.updateProfileStatus(
    userId,
    status,
    reason
  );

  res.status(200).json({
    status: "success",
    message: `User profile is now ${status}`,
    data: {
      id: updatedUser.id,
      profileStatus: updatedUser.profileStatus,
    },
  });
});

// --- STAGE 1: BASICS ---
export const getBasicInfo = catchAsync(async (req, res) => {
  const data = await ProfileService.getBasicInfo(req.user.id);
  // If data exists, return it. If not, return null (Frontend handles empty form)
  res.status(200).json({ status: "success", data });
});

// --- STAGE 1: PHOTOS ---
export const getPhotos = catchAsync(async (req, res) => {
  const data = await ProfileService.getPhotos(req.user.id);
  res.status(200).json({ status: "success", data });
});

// --- STAGE 1: IDENTITY ---
export const getIdentity = catchAsync(async (req, res) => {
  const data = await ProfileService.getIdentityStatus(req.user.id);
  res.status(200).json({ status: "success", data });
});

// --- STAGE 2: BACKGROUND ---
export const getBackgroundInfo = catchAsync(async (req, res) => {
  const data = await ProfileService.getBackgroundInfo(req.user.id);
  res.status(200).json({ status: "success", data });
});

// --- STAGE 3: HEALTH ---
export const getHealthInfo = catchAsync(async (req, res) => {
  const data = await ProfileService.getHealthInfo(req.user.id);
  res.status(200).json({ status: "success", data });
});

// --- STAGE 4: GENETIC ---
export const getGeneticInfo = catchAsync(async (req, res) => {
  const data = await ProfileService.getGeneticInfo(req.user.id);
  res.status(200).json({ status: "success", data });
});

// --- STAGE 5: COMPENSATION ---
export const getCompensationInfo = catchAsync(async (req, res) => {
  const data = await ProfileService.getCompensationInfo(req.user.id);
  res.status(200).json({ status: "success", data });
});

// --- STAGE 6: LEGAL ---
export const getLegalInfo = catchAsync(async (req, res) => {
  const data = await ProfileService.getLegalInfo(req.user.id);
  res.status(200).json({ status: "success", data });
});

// GET /api/v1/user/profile/current
export const getCurrentProfile = catchAsync(async (req, res, next) => {
  // 1. Fetch EVERYTHING about the user
  const user = await ProfileService.getFullUserProfile(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // 2. DYNAMIC STAGE CALCULATION
  let lastCompletedStage = 0;

  // --- STAGE 1 CHECK (Basics + Identity + Photos) ---
  const hasBasics = !!user.profile?.legalName;
  const hasIdentity =
    user.identityDocuments && user.identityDocuments.length > 0;
  const hasPhotos = !!(
    user.profile?.babyPhotoUrl && user.profile?.currentPhotoUrl
  );

  // Only if ALL three parts of Stage 1 are done do we count Stage 1 as complete
  if (hasBasics && hasIdentity && hasPhotos) {
    lastCompletedStage = 1;
  }

  // --- STAGE 2 CHECK (Background) ---
  // If Stage 1 is done AND they have a Bio (last field of Stage 2)
  if (lastCompletedStage >= 1 && user.profile?.bio) {
    lastCompletedStage = 2;
  }

  // --- STAGE 3 CHECK (Health) ---
  // If Stage 2 is done AND Health record exists
  if (lastCompletedStage >= 2 && user.health) {
    lastCompletedStage = 3;
  }

  // --- STAGE 4 CHECK (Genetic) ---
  // If Stage 3 is done AND Genetic record exists
  if (lastCompletedStage >= 3 && user.genetic) {
    lastCompletedStage = 4;
  }

  // --- STAGE 5 CHECK (Compensation) ---
  // If Stage 4 is done AND 'isInterested' is set (true or false)
  if (
    lastCompletedStage >= 4 &&
    user.compensation?.isInterested !== null &&
    user.compensation?.isInterested !== undefined
  ) {
    lastCompletedStage = 5;
  }

  // --- STAGE 6 CHECK (Legal) ---
  // If Stage 5 is done AND Consent is agreed
  if (lastCompletedStage >= 5 && user.legal?.consentAgreed) {
    lastCompletedStage = 6;
  }

  // 3. SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      user,
      // If Stage 1 is incomplete (e.g., only Basics done), lastCompletedStage is 0.
      // So suggestedStage becomes 1. Frontend stays on Stage 1.
      suggestedStage: lastCompletedStage + 1,
      isComplete: lastCompletedStage === 6,
    },
  });
});
