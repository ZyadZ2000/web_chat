import express from 'express';

// Custom Modules
import * as chatController from '../controllers/chat.js';
import { auth_jwt } from '../middleware/auth.js';
import upload from '../../config/multer.js';

const router = express.Router();

// Anything that receives data should be validated

// Allow the user to send settings, name (needed), picture
router.post(
  '/create',
  auth_jwt,
  upload.single('chatPicture'),
  chatController.create_chat
);

router.get('/search/:name', chatController.get_chat);

router.get('/:chatId', auth_jwt, chatController.get_chat);
