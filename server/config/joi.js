import Joi from 'joi';

// Email Schema
const emailSchema = Joi.string().email().required();

// Username Schema
const usernameSchema = Joi.string().min(3).max(20).required();

// Password Schema
const passwordSchema = Joi.string().min(6).max(30).required();

// ObjectId Schema
const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required();

export { emailSchema, usernameSchema, passwordSchema, objectIdSchema };
