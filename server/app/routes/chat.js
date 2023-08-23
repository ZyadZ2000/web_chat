import express from 'express';

// Custom Modules
import * as chatController from '../controllers/chat.js';
import { auth_jwt } from '../middleware/auth.js';
import upload from '../../config/multer.js';
import validate_data from '../middleware/validation.js';
import * as validationSchemas from '../../config/joi.js';
import { validate } from 'uuid';

const router = express.Router();

router.get(
  '/',
  validate_data(
    ['chatId'],
    {
      chatId: validationSchemas.objectIdSchema,
    },
    'body'
  ),
  validate_data(
    ['page'],
    {
      page: validationSchemas.notRequiredNumberSchema,
    },
    'query'
  ),
  auth_jwt,
  chatController.get_chat(false)
);

router.get(
  '/messages',
  validate_data(
    ['chatId'],
    {
      chatId: validationSchemas.objectIdSchema,
    },
    'body'
  ),
  validate_data(
    ['page'],
    {
      page: validationSchemas.notRequiredNumberSchema,
    },
    'query'
  ),
  auth_jwt,
  chatController.get_chat(true)
);

router.get(
  '/search',
  validate_data(
    ['name'],
    {
      name: validationSchemas.notRequiredNameSchema,
    },
    'query'
  ),
  chatController.search_chats
);

router.get(
  '/requests',
  validate_data(
    ['chatId'],
    {
      chatId: validationSchemas.objectIdSchema,
    },
    'body'
  ),
  auth_jwt,
  chatController.get_chat_requests
);

router.post(
  '/create',
  validate_data(
    ['chatName', 'chatDescription'],
    {
      chatName: validationSchemas.nameSchema,
      chatDescription: validationSchemas.longStringSchema,
    },
    'body'
  ),
  auth_jwt,
  upload.single('chatPhoto'),
  chatController.create_chat
);

export default router;
