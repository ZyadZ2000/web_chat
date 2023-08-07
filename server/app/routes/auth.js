// Third Party
import express from 'express';

// Custom modules
import * as authController from '../controllers/auth';

const router = express.Router();

/*
Data provided:
    email
    password
    password_confirm
    username

Additional constraints:
no two users with the same email, or username
*/
router.post('/signup', authController.signup);

/*
email
password
*/
router.post('/login', authController.login);

/*
No data needed
*/
router.post('/reset/password', authController.reset_password);

/*
email
new_password
confirm_password
*/
router.post('/reset/confirm', authController.reset_confirm);

export default router;
