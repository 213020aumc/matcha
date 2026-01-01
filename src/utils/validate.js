import Joi from "joi";
import { AppError } from "./AppError.js";

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[property];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message.replace(/"/g, ""))
        .join(". ");
      return next(new AppError(errorMessage, 400));
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

export default validate;
