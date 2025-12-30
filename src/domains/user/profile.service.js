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
// Optional we can delete this as now we have comprehensive update
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
// Optional we can delete this as now we have comprehensive update
export const updateBackgroundInfo = async (
  userId,
  data,
  isStepComplete = false
) => {
  return await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.update({
      where: { userId },
      data: {
        education: data.education || undefined,
        occupation: data.occupation || undefined,
        nationality: data.nationality || undefined,
        diet: data.diet || undefined,
        height: data.height ? parseInt(data.height) : undefined,
        weight: data.weight ? parseInt(data.weight) : undefined,
        bodyBuild: data.bodyBuild || undefined,
        hairColor: data.hairColor || undefined,
        eyeColor: data.eyeColor || undefined,
        race: data.race || undefined,
        orientation: data.orientation || undefined,
        bio: data.bio || undefined,
      },
    });

    if (isStepComplete) {
      await advanceStep(tx, userId, 2);
    }

    return profile;
  });
};

// --- Stage 3: Health ---
// Optional we can delete this as now we have comprehensive update
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
    reproductiveConds,
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
    reproductiveConds:
      reproductiveConds === "true" || reproductiveConds === true,
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
// Optional we can delete this as now we have comprehensive update
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
      accessRole: {
        include: {
          permissions: true,
        },
      },
    },
  });
};

export const updateGeneralProfile = async (userId, data) => {
  // Destructure potential fields to ensure we only update what is allowed
  const {
    // User Core Fields
    gender,
    serviceType,
    interestedIn,
    pairingTypes,

    // UserProfile Fields
    legalName,
    dob,
    phoneNumber,
    address,
    education,
    occupation,
    nationality,
    diet,
    height,
    weight,
    bodyBuild,
    hairColor,
    eyeColor,
    race,
    orientation,
    bio,
  } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Update Core User Data
    // Only include fields if they are defined in the payload
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        gender: gender || undefined,
        serviceType: serviceType || undefined,
        interestedIn: interestedIn || undefined,
        pairingTypes: pairingTypes || undefined,
      },
    });

    // 2. Update Extended Profile Data (Upsert ensures it exists)
    const profile = await tx.userProfile.upsert({
      where: { userId },
      update: {
        legalName: legalName || undefined,
        dob: dob ? new Date(dob) : undefined,
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        education: education || undefined,
        occupation: occupation || undefined,
        nationality: nationality || undefined,
        diet: diet || undefined,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        bodyBuild: bodyBuild || undefined,
        hairColor: hairColor || undefined,
        eyeColor: eyeColor || undefined,
        race: race || undefined,
        orientation: orientation || undefined,
        bio: bio || undefined,
      },
      create: {
        userId,
        legalName,
        dob: dob ? new Date(dob) : undefined,
        phoneNumber,
        address,
        education,
        occupation,
        nationality,
        diet,
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        bodyBuild,
        hairColor,
        eyeColor,
        race,
        orientation,
        bio,
      },
    });

    return { ...user, profile };
  });
};

export const updateComprehensiveProfile = async (userId, data) => {
  return await prisma.$transaction(async (tx) => {
    // 1. SEPARATE DATA BY MODEL
    const {
      // --- MODEL: USER (Core) ---
      gender,
      serviceType,
      interestedIn,
      pairingTypes,

      // --- MODEL: USER PROFILE (Basics & Background) ---
      legalName,
      dob,
      phoneNumber,
      address,
      education,
      occupation,
      nationality,
      diet,
      height,
      weight,
      bodyBuild,
      hairColor,
      eyeColor,
      race,
      orientation,
      bio,

      // --- MODEL: USER HEALTH (Medical) ---
      diabetes,
      heart,
      autoimmune,
      cancer,
      neuroDisorder,
      respiratory,
      otherConditions,
      majorSurgeries,
      allergies,
      allergiesDetails,
      cmvStatus,
      medications,
      mentalHealth, // mapped to mentalHealthHistory
      biologicalChildren,
      reproductiveIssues,
      menstrualRegularity,
      pregnancyHistory,
      reproductiveConds,
      hivStatus, // mapped to hivHepStatus
      needleUsage,
      transfusionHistory,
      malariaRisk,
      zikaRisk,

      // --- MODEL: USER COMPENSATION ---
      isInterested,
      allowBidding,
      askingPrice,
      minAccepted, // mapped to minAcceptedPrice
      buyNow, // mapped to buyNowPrice

      // --- MODEL: USER GENETIC ---
      conditions, // mapped to carrierConditions

      // --- MODEL: USER LEGAL (Added) ---
      anonymityPreference,
    } = data;

    // 2. PREPARE PAYLOADS

    // --- Core User Payload ---
    const userPayload = {};
    if (gender !== undefined) userPayload.gender = gender;
    if (serviceType !== undefined) userPayload.serviceType = serviceType;
    if (interestedIn !== undefined) userPayload.interestedIn = interestedIn;
    if (pairingTypes !== undefined) userPayload.pairingTypes = pairingTypes;

    // --- User Profile Payload ---
    const profilePayload = {};
    if (legalName !== undefined) profilePayload.legalName = legalName;
    if (dob !== undefined) profilePayload.dob = new Date(dob);
    if (phoneNumber !== undefined) profilePayload.phoneNumber = phoneNumber;
    if (address !== undefined) profilePayload.address = address;
    if (education !== undefined) profilePayload.education = education;
    if (occupation !== undefined) profilePayload.occupation = occupation;
    if (nationality !== undefined) profilePayload.nationality = nationality;
    if (diet !== undefined) profilePayload.diet = diet;
    if (height !== undefined) profilePayload.height = parseInt(height);
    if (weight !== undefined) profilePayload.weight = parseInt(weight);
    if (bodyBuild !== undefined) profilePayload.bodyBuild = bodyBuild;
    if (hairColor !== undefined) profilePayload.hairColor = hairColor;
    if (eyeColor !== undefined) profilePayload.eyeColor = eyeColor;
    if (race !== undefined) profilePayload.race = race;
    if (orientation !== undefined) profilePayload.orientation = orientation;
    if (bio !== undefined) profilePayload.bio = bio;

    // --- User Health Payload ---
    const healthPayload = {};
    if (diabetes !== undefined) healthPayload.hasDiabetes = Boolean(diabetes);
    if (heart !== undefined) healthPayload.hasHeartCondition = Boolean(heart);
    if (autoimmune !== undefined)
      healthPayload.hasAutoimmune = Boolean(autoimmune);
    if (cancer !== undefined) healthPayload.hasCancer = Boolean(cancer);
    if (neuroDisorder !== undefined)
      healthPayload.hasNeuroDisorder = Boolean(neuroDisorder);
    if (respiratory !== undefined)
      healthPayload.hasRespiratory = Boolean(respiratory);
    if (otherConditions !== undefined)
      healthPayload.otherConditions = otherConditions;
    if (majorSurgeries !== undefined)
      healthPayload.majorSurgeries = majorSurgeries;
    if (allergies !== undefined) healthPayload.allergies = Boolean(allergies);
    if (allergiesDetails !== undefined)
      healthPayload.allergiesDetails = allergiesDetails;
    if (cmvStatus !== undefined) healthPayload.cmvStatus = cmvStatus;
    if (medications !== undefined) healthPayload.medications = medications;
    if (mentalHealth !== undefined)
      healthPayload.mentalHealthHistory = mentalHealth;
    if (biologicalChildren !== undefined)
      healthPayload.biologicalChildren = Boolean(biologicalChildren);
    if (reproductiveIssues !== undefined)
      healthPayload.reproductiveIssues = Boolean(reproductiveIssues);
    if (menstrualRegularity !== undefined)
      healthPayload.menstrualRegularity = Boolean(menstrualRegularity);
    if (pregnancyHistory !== undefined)
      healthPayload.pregnancyHistory = Boolean(pregnancyHistory);
    if (reproductiveConds !== undefined)
      healthPayload.reproductiveConds = Boolean(reproductiveConds);
    if (hivStatus !== undefined)
      healthPayload.hivHepStatus = Boolean(hivStatus);
    if (needleUsage !== undefined)
      healthPayload.needleUsage = Boolean(needleUsage);
    if (transfusionHistory !== undefined)
      healthPayload.transfusionHistory = Boolean(transfusionHistory);
    if (malariaRisk !== undefined)
      healthPayload.malariaRisk = Boolean(malariaRisk);
    if (zikaRisk !== undefined) healthPayload.zikaRisk = Boolean(zikaRisk);

    // --- User Compensation Payload ---
    const compPayload = {};
    if (isInterested !== undefined)
      compPayload.isInterested = Boolean(isInterested);
    if (allowBidding !== undefined)
      compPayload.allowBidding = Boolean(allowBidding);
    if (askingPrice !== undefined)
      compPayload.askingPrice = parseFloat(askingPrice);
    if (minAccepted !== undefined)
      compPayload.minAcceptedPrice = parseFloat(minAccepted);
    if (buyNow !== undefined) compPayload.buyNowPrice = parseFloat(buyNow);

    // --- User Genetic Payload ---
    const geneticPayload = {};
    if (conditions !== undefined) {
      geneticPayload.carrierConditions = Array.isArray(conditions)
        ? conditions
        : typeof conditions === "string"
        ? JSON.parse(conditions)
        : [];
    }

    // --- User Legal Payload (Added) ---
    const legalPayload = {};
    if (anonymityPreference !== undefined)
      legalPayload.anonymityPreference = anonymityPreference;

    // 3. EXECUTE UPDATES

    // Update USER (Core)
    if (Object.keys(userPayload).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userPayload,
      });
    }

    // Upsert USER PROFILE
    if (Object.keys(profilePayload).length > 0) {
      await tx.userProfile.upsert({
        where: { userId },
        update: profilePayload,
        create: { userId, ...profilePayload },
      });
    }

    // Upsert USER HEALTH
    if (Object.keys(healthPayload).length > 0) {
      await tx.userHealth.upsert({
        where: { userId },
        update: healthPayload,
        create: { userId, ...healthPayload },
      });
    }

    // Upsert USER COMPENSATION
    if (Object.keys(compPayload).length > 0) {
      await tx.userCompensation.upsert({
        where: { userId },
        update: compPayload,
        create: { userId, ...compPayload },
      });
    }

    // Upsert USER GENETIC
    if (Object.keys(geneticPayload).length > 0) {
      await tx.userGenetic.upsert({
        where: { userId },
        update: geneticPayload,
        create: { userId, ...geneticPayload },
      });
    }

    // Upsert USER LEGAL
    if (Object.keys(legalPayload).length > 0) {
      await tx.userLegal.upsert({
        where: { userId },
        update: legalPayload,
        create: { userId, ...legalPayload },
      });
    }

    // 4. RETURN FULL FRESH DATA
    return await tx.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        health: true,
        genetic: true,
        compensation: true,
        legal: true,
        identityDocuments: true,
        accessRole: {
          include: {
            permissions: true,
          },
        },
      },
    });
  });
};
