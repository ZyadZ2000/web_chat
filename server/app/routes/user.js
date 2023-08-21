import express from 'express';

// Custom Modules
import * as userController from '../controllers/user.js';
import { auth_jwt, auth_local } from '../middleware/auth.js';
import upload from '../../config/multer.js';
import validate_data from '../middleware/validation.js';
import * as validationSchemas from '../../config/joi.js';

const router = express.Router();

router.get('/profile', auth_jwt, userController.get_profile);

router.get(
  '/view/:username',
  validate_data(
    ['username'],
    {
      username: validationSchemas.nameSchema,
    },
    'params'
  ),
  userController.get_user
);

router.get('/friends', auth_jwt, userController.get_friends);

router.get('/chats', auth_jwt, userController.get_chats);

router.get(
  '/requests/received',
  auth_jwt,
  userController.get_received_requests
);

router.get('/requests/sent', auth_jwt, userController.get_sent_requests);

router.get(
  '/search',
  validate_data(
    ['username'],
    {
      username: validationSchemas.notRequiredNameSchema,
    },
    'query'
  ),
  userController.search_users
);

router.put(
  '/email',
  validate_data(
    ['email', 'password', 'newEmail'],
    {
      email: validationSchemas.emailSchema,
      password: validationSchemas.passwordSchema,
      newEmail: validationSchemas.emailSchema,
    },
    'body'
  ),
  auth_local,
  userController.update_email
);

router.put(
  '/username',
  validate_data(
    ['email', 'password', 'newUsername'],
    {
      email: validationSchemas.emailSchema,
      password: validationSchemas.passwordSchema,
      newUsername: validationSchemas.nameSchema,
    },
    'body'
  ),
  auth_local,
  userController.update_username
);

router.put(
  '/password',
  validate_data(
    ['email', 'password', 'newPass', 'newPassConfirm'],
    {
      email: validationSchemas.emailSchema,
      password: validationSchemas.passwordSchema,
      newPass: validationSchemas.passwordSchema,
      newPassConfirm: validationSchemas.passwordSchema,
    },
    'body'
  ),
  auth_local,
  userController.update_password
);

router.put(
  '/bio',
  validate_data(
    ['bio'],
    {
      bio: validationSchemas.longStringSchema,
    },
    'body'
  ),
  auth_jwt,
  userController.update_bio
);

router.put(
  '/photo',
  auth_jwt,
  upload.single('profilePhoto'),
  userController.update_picture
);

export default router;
