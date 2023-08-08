import Joi from 'joi';

// Email Schema
export const emailSchema = Joi.string().email().required();

// Username Schema
export const usernameSchema = Joi.string().min(3).max(20).required();

// Password Schema
export const passwordSchema = Joi.string().min(6).max(30).required();

// ObjectId Schema
export const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required();

export const tokenSchema = Joi.string().length(64).hex().required();
