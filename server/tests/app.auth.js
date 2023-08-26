import request from 'supertest';
import app from '../app/index.js';
import User from '../models/user.js';
import { connect_app, disconnect_app } from './utils/connectDisconnect.js';

let userId;
let server;
let agent;

export default function () {
  return describe('Testing authentication routes', () => {
    beforeAll(async () => {
      let result = await connect_app(app, 5000);
      agent = result.agent;
      server = result.server;
    });

    afterAll(async () => {
      await User.deleteOne({ _id: userId });
      await disconnect_app(server);
    });

    it('should not sign up with invalid data', async () => {
      const res = await agent.post('/auth/signup').send({
        email: 'zyad6@zyad.com',
        username: 'zyad6',
        password: 'zyadzz',
        passwordConfirm: 'zyadzaa',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should sign up a new user', async () => {
      const res = await agent.post('/auth/signup').send({
        email: 'zyad6@zyad.com',
        username: 'zyad6',
        password: 'zyadzz',
        passwordConfirm: 'zyadzz',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('should not register a duplicate', async () => {
      const res = await agent.post('/auth/signup').send({
        email: 'zyad6@zyad.com',
        username: 'zyad6',
        password: 'zyadzz',
        passwordConfirm: 'zyadzz',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('message');
    });

    it('should not login with invalid data', async () => {
      const res = await agent.post('/auth/login').send({
        email: 'zyad6',
        password: 'zyadzz',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should login and receive token', async () => {
      const res = await agent.post('/auth/login').send({
        email: 'zyad6@zyad.com',
        password: 'zyadzz',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      userId = res.body.user._id.toString();
    });

    it('should not login with invalid credentials', async () => {
      const res = await agent.post('/auth/login').send({
        email: 'zyad6@zyad.com',
        password: 'zyadza',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });
}
