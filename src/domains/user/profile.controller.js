import * as ProfileService from "./profile.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { getFileUrl } from "../../utils/upload.js";
import prisma from "../../config/prisma.js";

export const submitOnboarding = catchAsync(async (req, res, next) => {
  const { role, serviceType, interestedIn } = req.body;

  // --- 1. SURROGACY ---
  if (serviceType === "SURROGACY_SERVICES") {
    // SCENARIO: User says "I want to BE a Surrogate" (Role: DONOR)
    if (role === "DONOR") {
      req.body.interestedIn = null;
    }

    // SCENARIO: User says "I am LOOKING FOR a Surrogate" (Role: ASPIRING_PARENT)
    else if (role === "ASPIRING_PARENT") {
      // Rule: Parents don't need to specify their own gametes here, they are the recipients.
      // Action: Ensure 'interestedIn' is null.
      req.body.interestedIn = null;
    }

    // SCENARIO: Invalid Roles
    else {
      // Other roles like 'RECIPIENT' that shouldn't be here
      return next(new AppError("Invalid role for Surrogacy Services.", 400));
    }
  }

  // --- 2. DONOR FLOW VALIDATION ---
  if (serviceType === "DONOR_SERVICES") {
    // SCENARIO: User says "I want to DONATE" (Egg/Sperm/Embryo)
    if (role === "DONOR") {
      // Rule: Standard Donors MUST specify what they are donating.
      if (!interestedIn) {
        return next(
          new AppError(
            "Donors must specify what they are donating (Egg/Sperm/Embryo)",
            400
          )
        );
      }
    }
  }

  const result = await ProfileService.updateOnboardingData(
    req.user.id,
    req.body
  );

  res.status(200).json({
    status: "success",
    data: {
      user: result,
      nextStep: "PROFILE_COMPLETION", // Frontend signal to move to next screen
    },
  });
});

// --- STAGE 1: Basics ---
export const updateBasicInfo = catchAsync(async (req, res, next) => {
  // Extract isComplete flag to see if user clicked "Next"
  const { isComplete, ...data } = req.body;

  const result = await ProfileService.upsertBasicInfo(
    req.user.id,
    data,
    isComplete === "true" || isComplete === true
  );

  res.status(200).json({ status: "success", data: result });
});

export const uploadIdentityDoc = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No document file provided", 400));
  }

  // Helper handles S3 vs Local logic automatically
  const fileUrl = getFileUrl(req, req.file);

  // Note: Identity Doc upload usually doesn't complete the whole stage by itself
  const result = await ProfileService.saveIdentityDoc(
    req.user.id,
    req.body.type,
    fileUrl
  );
  res.status(200).json({ status: "success", data: result });
});

export const uploadPhotos = catchAsync(async (req, res, next) => {
  const photoUrls = {};
  const { isComplete } = req.body;

  // Helper handles S3 vs Local logic automatically
  if (req.files?.["baby"]?.[0]) {
    photoUrls.babyPhotoUrl = getFileUrl(req, req.files["baby"][0]);
  }
  if (req.files?.["current"]?.[0]) {
    photoUrls.currentPhotoUrl = getFileUrl(req, req.files["current"][0]);
  }

  const result = await ProfileService.updateProfilePhotos(
    req.user.id,
    photoUrls,
    isComplete === "true" || isComplete === true
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 2: Background ---
export const updateBackground = catchAsync(async (req, res, next) => {
  const { isComplete, ...data } = req.body;
  
  // Only validate required fields when marking as complete AND user is surrogacy candidate
  if (
    (isComplete === "true" || isComplete === true) &&
    req.user.serviceType === "SURROGACY_SERVICES"
  ) {
    // Fetch the user's profile to check for existing dob
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user.id },
      select: { dob: true, height: true, weight: true }
    });

    const requiredFields = ["height", "weight"];
    const missing = requiredFields.filter(
      (field) => !data[field] && !existingProfile?.[field]
    );

    // Check dob separately since it's from Stage 1
    if (!existingProfile?.dob) {
      missing.push("dob");
    }

    if (missing.length > 0) {
      return next(
        new AppError(
          `Surrogacy candidates must provide: ${missing.join(", ")}`,
          400
        )
      );
    }
  }

  const result = await ProfileService.updateBackgroundInfo(
    req.user.id,
    data,
    isComplete === "true" || isComplete === true
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 3: Health ---
export const updateHealth = catchAsync(async (req, res, next) => {
  const { isComplete, ...data } = req.body;

  if (
    (isComplete === "true" || isComplete === true) &&
    req.user.serviceType === "SURROGACY_SERVICES"
  ) {
    // 1. Pregnancy History is MANDATORY for surrogates
    // (We check undefined because false is a valid boolean answer, though usually surrogates must have history)
    if (
      data.pregnancyHistory === undefined &&
      data.pregnancyHistory !== "false" &&
      data.pregnancyHistory !== "true"
    ) {
      return next(
        new AppError(
          "Pregnancy history is required for surrogacy candidates.",
          400
        )
      );
    }

    // 2. Menstrual Regularity is MANDATORY
    if (
      data.menstrualRegularity === undefined &&
      data.menstrualRegularity !== "false" &&
      data.menstrualRegularity !== "true"
    ) {
      return next(
        new AppError("Menstrual regularity information is required.", 400)
      );
    }
  }

  const result = await ProfileService.updateHealthHistory(
    req.user.id,
    data,
    isComplete === "true" || isComplete === true
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 4: Genetic ---
export const updateGenetic = catchAsync(async (req, res, next) => {

  // console.log("Received genetic update request");
  // console.log("Body:", req.body);
  // console.log("File:", req.file);

  const fileUrl = req.file ? getFileUrl(req, req.file) : null;
  const { isComplete, conditions } = req.body;

  // Parse conditions safely
  let parsedConditions = [];
  if (conditions) {
    try {
      parsedConditions = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
    } catch (e) {
      console.error("Failed to parse conditions:", e);
      parsedConditions = [];
    }
  }

  const result = await ProfileService.updateGeneticProfile(
    req.user.id,
    conditions,
    fileUrl,
    isComplete === "true" || isComplete === true
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 5: Compensation ---
export const updateCompensation = catchAsync(async (req, res, next) => {
  const { isComplete, ...data } = req.body;

  if (data.allowBidding === "true" && !data.minAccepted) {
    return next(
      new AppError(
        "Minimum accepted price is required when bidding is allowed",
        400
      )
    );
  }
  const result = await ProfileService.upsertCompensation(
    req.user.id,
    data,
    isComplete === "true" || isComplete === true
  );
  res.status(200).json({ status: "success", data: result });
});

// --- STAGE 6: Legal ---
export const completeProfile = catchAsync(async (req, res, next) => {
  const { consentAgreed, anonymityPreference } = req.body;

  if (!consentAgreed) {
    return next(new AppError("You must agree to the consent form", 400));
  }

  // This service method explicitly sets onboardingStep to 6
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

  // 2. EXPLICIT STATE FROM DB
  // No longer guessing based on fields. The 'onboardingStep' column is the source of truth.
  const currentStep = user.onboardingStep || 0;

  // 3. SEND RESPONSE
  res.status(200).json({
    status: "success",
    data: {
      user,
      lastCompletedStep: currentStep,
      // If they finished step 2, we suggest step 3.
      suggestedStage: currentStep + 1,
      // Fully complete if they hit the final step (6)
      isComplete: currentStep >= 6,
    },
  });
});
