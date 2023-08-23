// NPM Packages
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Custom Modules
import io_init from '../websockets/index.js';
import authTests from './authTests.js';

// Node Modules
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const httpServer = http.createServer();

dotenv.config({ path: path.join(__dirname, '..', '.env') });

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
  });
  io_init(httpServer);
  httpServer.listen(3000);
});

afterAll(async () => {
  await mongoose.connection.close();
  await global.io.close();
  httpServer.close();
});

describe('all the tests', () => {
  let socket;
  authTests(socket);
});
