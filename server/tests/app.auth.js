import User from '../models/user.js';
import axios from 'axios';

const baseURL = 'http://localhost:3000';

let userId;

export default function () {
  return describe('Testing authentication routes', () => {
    afterAll(async () => {
      try {
        await User.deleteOne({ _id: userId });
      } catch (error) {}
    });

    it('should not sign up with invalid data', async () => {
      try {
        const res = await axios.post(`${baseURL}/auth/signup`, {
          email: 'zyad6@zyad.com',
          username: 'zyad6',
          password: 'zyadzz',
          passwordConfirm: 'zyadzaa',
        });

        expect(res.status).toBe(400);
        expect(res.data).toHaveProperty('errors');
      } catch (error) {}
    });

    it('should sign up a new user', async () => {
      const res = await axios.post(`${baseURL}/auth/signup`, {
        email: 'zyad6@zyad.com',
        username: 'zyad6',
        password: 'zyadzz',
        passwordConfirm: 'zyadzz',
      });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('message');
    });

    it('should not register a duplicate', async () => {
      try {
        const res = await axios.post(`${baseURL}/auth/signup`, {
          email: 'zyad6@zyad.com',
          username: 'zyad6',
          password: 'zyadzz',
          passwordConfirm: 'zyadzz',
        });

        expect(res.status).toBe(409);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should not login with invalid data', async () => {
      try {
        const res = await axios.post(`${baseURL}/auth/login`, {
          email: 'zyad6',
          password: 'zyadzz',
        });

        expect(res.status).toBe(400);
        expect(res.data).toHaveProperty('errors');
      } catch (error) {}
    });

    it('should login and receive token', async () => {
      try {
        const res = await axios.post(`${baseURL}/auth/login`, {
          email: 'zyad6@zyad.com',
          password: 'zyadzz',
        });

        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('token');
        expect(res.data).toHaveProperty('user');
        userId = res.data.user._id.toString();
      } catch (error) {}
    });

    it('should not login with invalid credentials', async () => {
      try {
        const res = await axios.post(`${baseURL}/auth/login`, {
          email: 'zyad6@zyad.com',
          password: 'zyadza',
        });

        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });
  });
}
