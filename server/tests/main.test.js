import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { fileURLToPath } from 'url';
import path from 'path';

import app_auth_tests from './app.auth.js';
import app_user_tests from './app.user.js';
import app_chat_tests from './app.chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

import ws_user_tests from './websockets.user.js';

describe('Main test', () => {
  app_auth_tests();
  app_user_tests();
  app_chat_tests();
  // ws_user_tests();
});
