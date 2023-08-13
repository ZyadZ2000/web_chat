import express from 'express';

// Custom Modules
import * as chatController from '../controllers/chat.js';
import { auth_jwt } from '../middleware/auth.js';
import upload from '../../config/multer.js';
import validate_data from '../middleware/validation.js';
import * as validationSchemas from '../../config/joi.js';

const router = express.Router();

router.post(
  '/create',
  validate_data(
    ['chatName', 'chatDescription'],
    {
      chatName: validationSchemas.nameStringSchema,
      chatDescription: validationSchemas.longStringSchema,
    },
    'body'
  ),
  auth_jwt,
  upload.single('photo'),
  chatController.create_chat
);

router.get(
  '/search',
  validate_data(
    ['name'],
    {
      name: validationSchemas.nameStringSchema,
    },
    'query'
  ),
  chatController.search_chats
);

router.get(
  '/:chatId',
  validate_data(
    ['chatId'],
    {
      chatId: validationSchemas.objectIdSchema,
    },
    'params'
  ),
  auth_jwt,
  chatController.get_chat
);
