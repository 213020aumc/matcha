import Joi from "joi";

// --- Onboarding Initial ---
export const onboardingSchema = Joi.object({
  gender: Joi.string().valid("WOMAN", "MAN", "OTHER").required().messages({
    "any.only": "Invalid gender selection",
    "any.required": "Gender is required",
  }),
  serviceType: Joi.string()
    .valid("DONOR_SERVICES", "SURROGACY_SERVICES")
    .required()
    .messages({
      "any.only": "Invalid service type",
      "any.required": "Service type is required",
    }),
  role: Joi.string()
    .valid("DONOR", "SURROGATE", "RECIPIENT", "ASPIRING_PARENT")
    .required()
    .messages({
      "any.only":
        "Role must be DONOR, SURROGATE, RECIPIENT, or ASPIRING_PARENT",
      "any.required": "Role is required",
    }),
  interestedIn: Joi.string()
    .valid("SPERM", "EGG", "EMBRYO")
    .required()
    .messages({
      "any.only": "InterestedIn must be one of SPERM, EGG, or EMBRYO",
      "any.required": "InterestedIn is required",
    }),
  pairingTypes: Joi.array().items(Joi.string()).optional(),
  termsAccepted: Joi.boolean().valid(true).required().messages({
    "any.only": "You must accept the terms and conditions",
    "any.required": "Terms acceptance is required",
  }),
});

// --- Stage 1: Basic Info ---
export const basicInfoSchema = Joi.object({
  legalName: Joi.string().min(2).max(100).trim().required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Legal name is required",
  }),
  dob: Joi.alternatives()
    .try(Joi.date().max("now"), Joi.string().isoDate())
    .required()
    .messages({
      "date.max": "Date of birth cannot be in the future",
      "any.required": "Date of birth is required",
    }),
  phoneNumber: Joi.string()
    .pattern(/^[\d\s\-+()]*$/)
    .allow("", null)
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),
  address: Joi.string().max(500).allow("", null).messages({
    "string.max": "Address cannot exceed 500 characters",
  }),
  isComplete: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
});

// --- Stage 1: Identity Document ---
export const identityDocSchema = Joi.object({
  type: Joi.string()
    .valid("DRIVER_LICENSE", "PASSPORT", "NATIONAL_ID")
    .required()
    .messages({
      "any.only":
        "Document type must be DRIVER_LICENSE, PASSPORT, or NATIONAL_ID",
      "any.required": "Document type is required",
    }),
});

// --- Stage 1: Photos (for FormData) ---
export const photosSchema = Joi.object({
  isComplete: Joi.string().valid("true", "false").optional(),
});

// --- Stage 2: Background ---
export const backgroundSchema = Joi.object({
  height: Joi.number().integer().min(50).max(300).allow(null).messages({
    "number.min": "Height must be at least 50 cm",
    "number.max": "Height cannot exceed 300 cm",
  }),
  weight: Joi.number().integer().min(20).max(500).allow(null).messages({
    "number.min": "Weight must be at least 20 kg",
    "number.max": "Weight cannot exceed 500 kg",
  }),
  bodyBuild: Joi.string()
    .valid("SLIM", "ATHLETIC", "AVERAGE", "CURVY", "LARGE")
    .allow(null, ""),
  hairColor: Joi.string()
    .valid(
      "AUBURN",
      "BLACK",
      "BLONDE",
      "BROWN",
      "RED",
      "GRAY",
      "WHITE",
      "OTHER"
    )
    .allow(null, ""),
  eyeColor: Joi.string()
    .valid("BLUE", "BLACK", "GREEN", "BROWN", "HAZEL", "GRAY", "OTHER")
    .allow(null, ""),
  race: Joi.string().max(100).allow(null, ""),
  orientation: Joi.string()
    .valid(
      "STRAIGHT",
      "GAY",
      "LESBIAN",
      "BISEXUAL",
      "PREFER_NOT_TO_SAY"
    )
    .allow(null, ""),
  education: Joi.string().max(200).allow(null, ""),
  occupation: Joi.string().max(200).allow(null, ""),
  nationality: Joi.string().max(100).allow(null, ""),
  diet: Joi.string()
    .valid(
      "OMNIVORE",
      "VEGETARIAN",
      "VEGAN",
      "KOSHER",
      "HALAL",
      "GLUTEN_FREE",
      "OTHER"
    )
    .allow(null, ""),
  bio: Joi.string().max(500).allow(null, ""),
  isComplete: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
});

// --- Stage 3: Health ---
export const healthSchema = Joi.object({
  bloodType: Joi.string()
    .valid(
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE"
    )
    .allow(null, ""),
  smokingStatus: Joi.string()
    .valid("NEVER", "FORMER", "CURRENT", "OCCASIONAL")
    .allow(null, ""),
  alcoholUse: Joi.string()
    .valid("NEVER", "RARELY", "SOCIALLY", "REGULARLY")
    .allow(null, ""),
  exerciseFrequency: Joi.string()
    .valid("NEVER", "RARELY", "WEEKLY", "DAILY")
    .allow(null, ""),
  // Reproductive conditions
  hasIrregularPeriods: Joi.boolean().allow(null),
  hasEndometriosis: Joi.boolean().allow(null),
  hasPCOS: Joi.boolean().allow(null),
  hasSTI: Joi.boolean().allow(null),
  hasFertilityIssues: Joi.boolean().allow(null),
  // Pregnancy history
  hasBeenPregnant: Joi.boolean().allow(null),
  numberOfPregnancies: Joi.number().integer().min(0).max(20).allow(null),
  numberOfLiveBirths: Joi.number().integer().min(0).max(20).allow(null),
  pregnancyComplications: Joi.string().max(1000).allow(null, ""),
  // Medical history
  hasMentalHealthCondition: Joi.boolean().allow(null),
  mentalHealthDetails: Joi.string().max(1000).allow(null, ""),
  hasChronicCondition: Joi.boolean().allow(null),
  chronicConditionDetails: Joi.string().max(1000).allow(null, ""),
  currentMedications: Joi.string().max(1000).allow(null, ""),
  allergies: Joi.string().max(500).allow(null, ""),
  surgeryHistory: Joi.string().max(1000).allow(null, ""),
  isComplete: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
});

// --- Stage 4: Genetic ---
export const geneticSchema = Joi.object({
  conditions: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string() // JSON string from FormData
    )
    .optional(),
  isComplete: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
});

// --- Stage 5: Compensation ---
export const compensationSchema = Joi.object({
  hasCompletedPreviously: Joi.boolean().allow(null),
  previousCompensationAmount: Joi.number().min(0).max(1000000).allow(null),
  expectedCompensation: Joi.number().min(0).max(1000000).allow(null),
  currency: Joi.string().length(3).uppercase().default("USD"),
  isNegotiable: Joi.boolean().default(true),
  additionalNotes: Joi.string().max(1000).allow(null, ""),
  isComplete: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid("true", "false"))
    .optional(),
});

// --- Stage 6: Complete Profile ---
export const completeProfileSchema = Joi.object({
  agreedToLegal: Joi.boolean().valid(true).required().messages({
    "any.only": "You must agree to the legal terms",
    "any.required": "Legal agreement is required",
  }),
});

// --- Edit Profile ---
export const editProfileSchema = Joi.object({
  legalName: Joi.string().min(2).max(100).trim(),
  phoneNumber: Joi.string()
    .pattern(/^[\d\s\-+()]*$/)
    .allow("", null),
  address: Joi.string().max(500).allow("", null),
  bio: Joi.string().max(500).allow(null, ""),
  height: Joi.number().integer().min(50).max(300).allow(null),
  weight: Joi.number().integer().min(20).max(500).allow(null),
  education: Joi.string().max(200).allow(null, ""),
  occupation: Joi.string().max(200).allow(null, ""),
  // Block email changes
  email: Joi.forbidden().messages({
    "any.unknown": "Email cannot be changed",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

// --- Admin: Approve Profile ---
export const approveProfileSchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "REJECTED").required().messages({
    "any.only": "Status must be ACTIVE or REJECTED",
    "any.required": "Status is required",
  }),
  rejectionReason: Joi.string()
    .max(500)
    .when("status", {
      is: "REJECTED",
      then: Joi.string().required(),
      otherwise: Joi.string().allow("", null),
    })
    .messages({
      "any.required": "Rejection reason is required when rejecting a profile",
    }),
});

// --- UUID Parameter Validation ---
export const userIdParamSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid user ID format",
    "any.required": "User ID is required",
  }),
});
