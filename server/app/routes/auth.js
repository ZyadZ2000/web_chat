// Third Party
import express from 'express';

// Custom modules
import * as authController from '../controllers/auth.js';
import validate_data from '../middleware/validation.js';
import * as validationSchemas from '../../config/joi.js';
import { auth_local } from '../middleware/auth.js';
import upload from '../../config/multer.js';

const router = express.Router();

router.post(
  '/signup',
  validate_data(
    ['email', 'username', 'password', 'passwordConfirm'],
    {
      email: validationSchemas.emailSchema,
      username: validationSchemas.nameSchema,
      password: validationSchemas.passwordSchema,
      passwordConfirm: validationSchemas.passwordSchema,
    },
    'body'
  ),
  upload.single('profilePhoto'),
  authController.signup
);

router.post(
  '/login',
  validate_data(
    ['email', 'password'],
    {
      email: validationSchemas.emailSchema,
      password: validationSchemas.passwordSchema,
    },
    'body'
  ),
  auth_local,
  authController.login
);

router.post(
  '/reset/password',
  validate_data(
    ['email'],
    {
      email: validationSchemas.emailSchema,
    },
    'body'
  ),
  authController.reset_password
);

router.get(
  '/reset/:resetToken',
  validate_data(
    ['resetToken'],
    {
      resetToken: validationSchemas.resetTokenSchema,
    },
    'params'
  ),
  authController.get_reset
);

router.post(
  '/reset/confirm',
  validate_data(
    ['email', 'password', 'passwordConfirm', 'resetToken'],
    {
      email: validationSchemas.emailSchema,
      password: validationSchemas.passwordSchema,
      passwordConfirm: validationSchemas.passwordSchema,
      resetToken: validationSchemas.resetTokenSchema,
    },
    'body'
  ),
  authController.reset_confirm
);

export default router;
