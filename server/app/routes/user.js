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
  '/profile/:username',
  validate_data(
    ['username'],
    {
      username: validationSchemas.nameSchema,
    },
    'params'
  ),
  userController.get_user
);

router.get(
  '/profile/friends',
  validate_data(
    ['friendIds'],
    {
      friendIds: validationSchemas.arrayObjectIdSchema,
    },
    'body'
  ),
  auth_jwt,
  userController.get_friends
);

router.get(
  '/profile/chats',
  validate_data(
    ['chatIds'],
    {
      chatIds: validationSchemas.arrayObjectIdSchema,
    },
    'body'
  ),
  auth_jwt,
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
  '/profile/starred/messages',
  validate_data(
    ['messageIds'],
    {
      messageIds: validationSchemas.arrayObjectIdSchema,
    },
    'body'
  ),
  auth_jwt,
  userController.get_starred_messages
);

router.get(
  '/search',
  validate_data(
    ['username'],
    {
      username: validationSchemas.nameSchema,
    },
    'query'
  ),
  userController.search_users
);

router.put(
  '/profile/email',
  validate_data(
    ['email', 'password', 'newEmail'],
    {
      email: validationSchemas.emailSchema,
      password: validationSchemas.passwordSchema,
      newEmail: validationSchemas.emailSchema,
    },
    'body'
  ),
  auth_local(false),
  userController.update_email
);

router.put(
  '/profile/username',
  validate_data(
    ['email', 'password', 'newUsername'],
    {
      email: validationSchemas.emailSchema,
      password: validationSchemas.passwordSchema,
      newUsername: validationSchemas.nameSchema,
    },
    'body'
  ),
  auth_local(false),
  userController.update_username
);

router.put(
  '/profile/password',
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
  auth_local(false),
  userController.update_password
);

router.put(
  '/profile/bio',
  validate_data([
    'bio',
    {
      bio: validationSchemas.longStringSchema,
    },
    'body',
  ]),
  auth_jwt,
  userController.update_bio
);

router.put(
  '/profile/picture',
  auth_jwt,
  upload.single('profilePhoto'),
  userController.update_picture
);

router.delete(
  '/',
  validate_data(
    ['email', 'password'],
    {
      email: validationSchemas.emailSchema,
      password: validationSchemas.passwordSchema,
    },
    'body'
  ),
  auth_local(false),
  userController.delete_user
);

export default router;
