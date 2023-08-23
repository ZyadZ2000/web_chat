import Joi from 'joi';

// Email Schema
const emailSchema = Joi.string().email().required();

// Name Schema
const nameSchema = Joi.string().min(3).max(20).required();

// Unrequired Name Schema
const notRequiredNameSchema = Joi.string().min(3).max(20);

// Schema for paragraphs
const longStringSchema = Joi.string().min(1).max(256);

// Password Schema
const passwordSchema = Joi.string().min(6).max(30).required();

// ObjectId Schema
const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required();

const arrayObjectIdSchema = Joi.array().items(
  Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
);

const messageContentSchema = Joi.string().min(1).max(512);

const messageTypeSchema = Joi.string().valid('text', 'file').required();

const resetTokenSchema = Joi.string().length(64).hex().required();

const notRequiredNumberSchema = Joi.number();

export {
  emailSchema,
  nameSchema,
  passwordSchema,
  objectIdSchema,
  resetTokenSchema,
  arrayObjectIdSchema,
  longStringSchema,
  messageContentSchema,
  messageTypeSchema,
  notRequiredNameSchema,
  notRequiredNumberSchema,
};
