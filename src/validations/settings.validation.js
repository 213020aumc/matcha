import Joi from "joi";

// Create Setting (for POST /settings if used)
export const createSettingSchema = Joi.object({
  key: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Key can only contain letters, numbers, and underscores",
      "any.required": "Setting key is required",
    }),
  value: Joi.alternatives()
    .try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object())
    .required()
    .messages({
      "any.required": "Setting value is required",
    }),
  description: Joi.string().max(500).allow("", null),
  category: Joi.string().max(50).default("general"),
  isPublic: Joi.boolean().default(false),
});

// Accepts an object: { "KEY": "Value", ... }
export const updateSettingsSchema = Joi.object()
  .pattern(
    Joi.string().min(2).max(100),
    Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean())
  )
  .min(1)
  .messages({
    "object.min": "At least one setting must be provided",
    "object.pattern.match": "Setting keys must be 2-100 characters",
  });
