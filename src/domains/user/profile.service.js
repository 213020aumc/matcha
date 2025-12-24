import prisma from "../../config/prisma.js";
import { EmailService } from "../../services/emailService.js";

/**
 * HELPER: Safely advances the onboarding step.
 * Only updates if the new step is greater than the current step.
 */
const advanceStep = async (tx, userId, stepNumber) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { onboardingStep: true },
  });

  if (user && user.onboardingStep < stepNumber) {
    await tx.user.update({
      where: { id: userId },
      data: { onboardingStep: stepNumber },
    });
  }
};

// --- Stage 1: Basics & Identity ---
// (Usually Step 1 is marked complete only after Basics + Photos + ID are done.
//  The controller should pass isStepComplete=true only on the final action of Stage 1)
export const upsertBasicInfo = async (userId, data, isStepComplete = false) => {
  return await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.upsert({
      where: { userId },
      update: {
        legalName: data.legalName,
        dob: new Date(data.dob),
        phoneNumber: data.phoneNumber,
        address: data.address,
      },
      create: {
        userId,
        legalName: data.legalName,
        dob: new Date(data.dob),
        phoneNumber: data.phoneNumber,
        address: data.address,
      },
    });

    if (isStepComplete) {
      await advanceStep(tx, userId, 1);
    }

    return profile;
  });
};

export const saveIdentityDoc = async (userId, type, fileUrl) => {
  // Identity docs are usually just one part of Stage 1.
  // We typically don't mark the whole step complete here unless it's the very last action.
  return await prisma.identityDocument.create({
    data: { userId, type, fileUrl },
  });
};

export const updateProfilePhotos = async (
  userId,
  photoUrls,
  isStepComplete = false
) => {
  return await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.upsert({
      where: { userId },
      update: photoUrls,
      create: { userId, ...photoUrls },
    });

    if (isStepComplete) {
      await advanceStep(tx, userId, 1);
    }

    return profile;
  });
};

// --- Stage 2: Background ---
export const updateBackgroundInfo = async (
  userId,
  data,
  isStepComplete = false
) => {
  return await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.update({
      where: { userId },
      data: {
        education: data.education,
        occupation: data.occupation,
        nationality: data.nationality,
        diet: data.diet,
        height: data.height ? parseInt(data.height) : null,
        weight: data.weight ? parseInt(data.weight) : null,
        hairColor: data.hairColor,
        eyeColor: data.eyeColor,
        bio: data.bio,
      },
    });

    if (isStepComplete) {
      await advanceStep(tx, userId, 2);
    }

    return profile;
  });
};

// --- Stage 3: Health ---
export const updateHealthHistory = async (
  userId,
  data,
  isStepComplete = false
) => {
  // Destructure incoming JSON keys
  const {
    diabetes,
    heart,
    autoimmune,
    mentalHealth,
    hivStatus,
    cancer,
    neuroDisorder,
    respiratory,
    otherConditions,
    majorSurgeries,
    allergies,
    allergiesDetails,
    cmvStatus,
    needleUsage,
    transfusionHistory,
    malariaRisk,
    zikaRisk,
    menstrualRegularity,
    pregnancyHistory,
  } = data;

  // Mapping to the Schema keys
  const sanitizedData = {
    hasDiabetes: diabetes === "true" || diabetes === true,
    hasHeartCondition: heart === "true" || heart === true,
    hasAutoimmune: autoimmune === "true" || autoimmune === true,
    mentalHealthHistory: mentalHealth,
    hivHepStatus: hivStatus === "true" || hivStatus === true,
    hasCancer: cancer === "true" || cancer === true,
    hasNeuroDisorder: neuroDisorder === "true" || neuroDisorder === true,
    hasRespiratory: respiratory === "true" || respiratory === true,

    // Direct mappings
    otherConditions,
    majorSurgeries,
    allergies: allergies === "true" || allergies === true,
    allergiesDetails,
    cmvStatus,
    needleUsage: needleUsage === "true" || needleUsage === true,
    transfusionHistory:
      transfusionHistory === "true" || transfusionHistory === true,
    malariaRisk: malariaRisk === "true" || malariaRisk === true,
    zikaRisk: zikaRisk === "true" || zikaRisk === true,

    // Handle optional/nulls
    menstrualRegularity:
      menstrualRegularity !== undefined ? menstrualRegularity : null,
    pregnancyHistory: pregnancyHistory !== undefined ? pregnancyHistory : null,
  };

  return await prisma.$transaction(async (tx) => {
    const health = await tx.userHealth.upsert({
      where: { userId },
      update: sanitizedData,
      create: { userId, ...sanitizedData },
    });

    if (isStepComplete) {
      await advanceStep(tx, userId, 3);
    }

    return health;
  });
};

// --- Stage 4: Genetic ---
export const updateGeneticProfile = async (
  userId,
  conditions,
  reportFileUrl,
  isStepComplete = false
) => {
  let carrierConditions = [];

  if (typeof conditions === "string") {
    try {
      carrierConditions = JSON.parse(conditions);
    } catch (e) {
      carrierConditions = [];
    }
  } else if (Array.isArray(conditions)) {
    carrierConditions = conditions;
  }

  const data = { carrierConditions };
  if (reportFileUrl) data.reportFileUrl = reportFileUrl;

  return await prisma.$transaction(async (tx) => {
    const genetic = await tx.userGenetic.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    if (isStepComplete) {
      await advanceStep(tx, userId, 4);
    }

    return genetic;
  });
};

// --- Stage 5: Compensation ---
export const upsertCompensation = async (
  userId,
  data,
  isStepComplete = false
) => {
  const payload = {
    isInterested: data.isInterested === "true" || data.isInterested === true,
    allowBidding: data.allowBidding === "true" || data.allowBidding === true,
    askingPrice: data.askingPrice ? parseFloat(data.askingPrice) : null,
    minAcceptedPrice: data.minAccepted ? parseFloat(data.minAccepted) : null,
    buyNowPrice: data.buyNow ? parseFloat(data.buyNow) : null,
  };

  return await prisma.$transaction(async (tx) => {
    const comp = await tx.userCompensation.upsert({
      where: { userId },
      update: payload,
      create: { userId, ...payload },
    });

    if (isStepComplete) {
      await advanceStep(tx, userId, 5);
    }

    return comp;
  });
};

// --- Stage 6: Completion ---
export const completeLegalAgreements = async (
  userId,
  consentAgreed,
  anonymityPreference
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Save Legal Data
    const legal = await tx.userLegal.upsert({
      where: { userId },
      update: { consentAgreed, anonymityPreference },
      create: { userId, consentAgreed, anonymityPreference },
    });

    // 2. Update User Status to PENDING_REVIEW
    // 3. Mark Stage 6 as complete (or set to 6 to indicate full completion)
    await tx.user.update({
      where: { id: userId },
      data: {
        profileStatus: "PENDING_REVIEW",
        onboardingStep: 6,
      },
    });

    return legal;
  });
};

// --- Misc / Admin Utils ---

export const updateOnboardingData = async (userId, data) => {
  const {
    termsAccepted,
    gender,
    role,
    serviceType,
    interestedIn,
    pairingTypes,
  } = data;

  return await prisma.user.update({
    where: { id: userId },
    data: {
      termsAccepted,
      gender,
      role, // This is crucial - sets them as DONOR or ASPIRING_PARENT
      serviceType,
      interestedIn,
      pairingTypes,
    },
  });
};

export const getPendingProfiles = async () => {
  return await prisma.user.findMany({
    where: { profileStatus: "PENDING_REVIEW" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      profile: true,
      health: true,
      genetic: true,
      identityDocuments: true,
      onboardingStep: true, // Useful to see for debugging
    },
    orderBy: { createdAt: "asc" },
  });
};

export const updateProfileStatus = async (userId, status, rejectionReason) => {
  // 1. Update the status in Database
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      profileStatus: status,
    },
    include: { profile: true },
  });

  // 2. Send Email Notification
  try {
    const emailService = new EmailService(user);

    if (status === "ACTIVE") {
      await emailService.sendProfileActive();
    } else if (status === "REJECTED") {
      await emailService.sendProfileRejected(rejectionReason);
    }
  } catch (error) {
    console.error(`❌ Failed to send status email to user ${userId}:`, error);
  }

  return user;
};

// --- Getters ---

export const getBasicInfo = async (userId) => {
  return await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      legalName: true,
      dob: true,
      phoneNumber: true,
      address: true,
    },
  });
};

export const getBackgroundInfo = async (userId) => {
  return await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      education: true,
      occupation: true,
      nationality: true,
      diet: true,
      height: true,
      weight: true,
      bodyBuild: true,
      hairColor: true,
      eyeColor: true,
      race: true,
      orientation: true,
      bio: true,
    },
  });
};

export const getHealthInfo = async (userId) => {
  return await prisma.userHealth.findUnique({ where: { userId } });
};

export const getGeneticInfo = async (userId) => {
  return await prisma.userGenetic.findUnique({ where: { userId } });
};

export const getCompensationInfo = async (userId) => {
  return await prisma.userCompensation.findUnique({ where: { userId } });
};

export const getLegalInfo = async (userId) => {
  return await prisma.userLegal.findUnique({ where: { userId } });
};

export const getPhotos = async (userId) => {
  return await prisma.userProfile.findUnique({
    where: { userId },
    select: { babyPhotoUrl: true, currentPhotoUrl: true },
  });
};

export const getIdentityStatus = async (userId) => {
  return await prisma.identityDocument.findMany({
    where: { userId },
    select: { type: true, uploadedAt: true, fileUrl: true },
  });
};

export const getFullUserProfile = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      health: true,
      genetic: true,
      compensation: true,
      legal: true,
      identityDocuments: true,
    },
  });
};
