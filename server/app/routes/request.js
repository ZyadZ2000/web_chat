import express from 'express';

// Custom Modules
import * as requestController from '../controllers/request.js';
import { auth_jwt } from '../middleware/auth.js';
import validate_data from '../middleware/validation.js';
import * as validationSchemas from '../../config/joi.js';

const router = express.router();

router.post(
  '/delete',
  validate_data(
    ['requestId'],
    {
      requestId: validationSchemas.objectIdSchema,
    },
    'body'
  ),
  requestController.delete_request
);
