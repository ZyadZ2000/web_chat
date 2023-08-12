import express from 'express';

// Custom Modules
import * as userController from '../controllers/user.js';
import { auth_jwt, auth_local } from '../middleware/auth.js';
import upload from '../../config/multer.js';
import validate_data from '../middleware/validation.js';

const router = express.Router();

router.get('/profile', auth_jwt, userController.get_profile);

router.get(
  '/profile/:username',
  validate_data(['username']),
  userController.get_user
);

// This should get the array of requested friends from the user.
router.get(
  '/profile/friends',
  validate_data(['arrayObjectIds']),
  auth_jwt,
  userController.get_friends
);

router.get(
  '/profile/chats',
  auth_jwt,
  validate_data(['arrayObjectIds']),
  userController.get_chats
);

router.get(
  '/profile/requests/received',
  auth_jwt,
  userController.get_received_requests
);

router.get(
  '/profile/requests/sent',
  auth_jwt,
  userController.get_sent_requests
);

router.get(
  '/profile/starred',
  validate_data(['arrayObjectIds']),
  auth_jwt,
  userController.get_starred_messages
);

router.get(
  '/search/:username',
  validate_data(['username']),
  userController.search_users
);

// Each of the next routes will need to get some data.
router.put('/profile/email', auth_local(false), userController.update_email);

router.put(
  '/profile/username',
  auth_local(false),
  userController.update_username
);

router.put(
  '/profile/password',
  auth_local(false),
  userController.update_password
);

router.put('/profile/bio', auth_jwt, userController.update_bio);

router.put(
  '/profile/picture',
  auth_jwt,
  upload.single('profilePicture'),
  userController.update_picture
);

router.delete('/', auth_local, userController.delete_user);

export default router;
