import Joi from "joi";

// Create Role
export const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required().messages({
    "string.min": "Role name must be at least 2 characters",
    "string.max": "Role name cannot exceed 50 characters",
    "any.required": "Role name is required",
  }),
  description: Joi.string().max(500).allow("", null),
  permissionIds: Joi.array().items(Joi.string().uuid()).optional().messages({
    "string.guid": "Invalid permission ID format",
  }),
});

// Assign Role to User
export const assignRoleSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid user ID format",
    "any.required": "User ID is required",
  }),
  roleId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid role ID format",
    "any.required": "Role ID is required",
  }),
});

// UUID param validation
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Invalid ID format",
    "any.required": "ID is required",
  }),
});
