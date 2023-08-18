// NPM Packages
import express from 'express';

// Custom Modules
import * as requestController from '../controllers/request.js';
import * as validationSchemas from '../../config/joi.js';
import { auth_jwt } from '../middleware/auth.js';
import validate_data from '../middleware/validation.js';

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
  auth_jwt,
  requestController.delete_request
);
