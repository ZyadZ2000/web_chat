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

const resetTokenSchema = Joi.string().length(64).hex().required();

const arrayObjectIdSchema = Joi.array().items(
  Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
);

const nameStringSchema = Joi.string().min(3).max(30).required();

const longStringSchema = Joi.string().min(1).max(256);

export {
  emailSchema,
  usernameSchema,
  passwordSchema,
  passwordSchema,
  objectIdSchema,
  resetTokenSchema,
  arrayObjectIdSchema,
  nameStringSchema,
  longStringSchema,
};
