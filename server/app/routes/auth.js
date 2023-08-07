// Third Party
import express from 'express';

// Custom modules
import * as authController from '../controllers/auth.js';
import validate_data from '../middleware/validation.js';
import { auth_local } from '../middleware/auth.js';
import upload from '../../config/multer.js';

const router = express.Router();

router.post(
  '/signup',
  validate_data(['email', 'password', 'passwordConfirm']),
  upload.single('profilePicture'),
  authController.signup
);

router.post(
  '/login',
  validate_data(['email', 'password']),
  auth_local,
  authController.login
);

router.post('/reset/password', authController.reset_password);

router.get('/reset/:token', authController.get_reset);

router.post(
  '/reset/confirm',
  validate_data(['email', 'password', 'passwordConfirm', 'token']),
  authController.reset_confirm
);

export default router;
