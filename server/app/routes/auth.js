// Third Party
import express from 'express';

// Custom modules
import * as authController from '../controllers/auth';
import validate_data from '../middleware/validation';

const router = express.Router();

router.post('/signup', validate_data, authController.signup);

router.post('/login', authController.login);

router.post('/reset/password', authController.reset_password);

router.post('/reset/confirm', authController.reset_confirm);

export default router;
