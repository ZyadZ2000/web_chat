import dotenv from 'dotenv';
import request from 'supertest';
import app from '../app/index.js';
import mongoose from 'mongoose';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

/* Connecting to the database before each test. */
beforeEach(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
  });
});

/* Closing database connection after each test. */
afterEach(async () => {
  await mongoose.connection.close();
});

describe('POST /auth/signup', () => {
  it('should not sign up with invalid data', async () => {
    const res = await request(app).post('/auth/signup').send({
      email: 'zyad6@zyad.com',
      username: 'zyad6',
      password: 'zyadzz',
      passwordConfirm: 'zyadzaa',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should not sign up with invalid data', async () => {
    const res = await request(app).post('/auth/signup').send({
      email: 'zyad6',
      username: 'zyad6',
      password: 'zyadzz',
      passwordConfirm: 'zyadzaa',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should sign up a new user', async () => {
    const res = await request(app).post('/auth/signup').send({
      email: 'zyad6@zyad.com',
      username: 'zyad6',
      password: 'zyadzz',
      passwordConfirm: 'zyadzz',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  it('should not register a duplicate', async () => {
    const res = await request(app).post('/auth/signup').send({
      email: 'zyad6@zyad.com',
      username: 'zyad6',
      password: 'zyadzz',
      passwordConfirm: 'zyadzz',
    });
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message');
  });
});
