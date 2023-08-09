import express from 'express';

// Custom Modules
import * as userController from '../controllers/user.js';
import { auth_jwt, auth_local } from '../middleware/auth.js';
import upload from '../../config/multer.js';

const router = express.Router();

// Anything that receives data should be validated

// Getting the profile of the user
router.get('/profile', auth_jwt, userController.get_profile);

// Getting the info of another user
router.get('/profile/:username', userController.get_user);

router.get('/profile/friends', auth_jwt, userController.get_friends);

router.get('/profile/chats', auth_jwt, userController.get_chats);

router.get('/profile/requests/received', userController.get_received_requests);

router.get('/profile/requests/sent', userController.get_sent_requests);

router.get('/profile/starred', userController.get_starred_messages);

router.get('/search/:username', userController.search_users);

router.put('/profile/email', auth_local, userController.update_email);

router.put('/profile/username', auth_local, userController.update_username);

router.put('/profile/password', auth_local, userController.update_password);

router.put('/profile/bio', auth_jwt, userController.update_bio);

router.put('profile/settings', auth_jwt, userController.update_settings);

router.put(
  '/profile/picture',
  auth_jwt,
  upload.single('profilePicture'),
  userController.update_picture
);

router.delete('/', auth_local, userController.delete_user);

export default router;
