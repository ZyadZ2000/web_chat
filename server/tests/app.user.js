import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../app/index.js';
import User from '../models/user.js';
//import { connect_app, disconnect_app } from './utils/connectDisconnect.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let token;
let server;
let agent;
let userId;

export default function () {
  return describe('testing user routes', () => {
    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('zyadzz', 10);
      const user = new User({
        email: 'zyad6@zyad.com',
        username: 'zyad6',
        password: hashedPassword,
      });
      await user.save();
      userId = user.id;
      //sign a token
      token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      let result = await connect_app(app, 5000);
      agent = result.agent;
      server = result.server;
    });

    afterAll(async () => {
      await User.deleteOne({ _id: userId });
      await disconnect_app(server);
    });

    it('should not get user data without a token', async () => {
      const res = await agent.get('/user/profile');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get user data with a token', async () => {
      const res = await agent
        .get('/user/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should view a user profile by username', async () => {
      const res = await agent.get('/user/view/zyad6');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should not get the user friends without a token', async () => {
      const res = await agent.get('/user/friends');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get the user friends with a token', async () => {
      const res = await agent
        .get('/user/friends')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('friends');
    });

    it('should not get user chats without a token', async () => {
      const res = await agent.get('/user/chats');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get user chats with a token', async () => {
      const res = await agent
        .get('/user/chats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('chats');
    });

    it('should not get sent requests without a token', async () => {
      const res = await agent.get('/user/requests/sent');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get sent requests with a token', async () => {
      const res = await agent
        .get('/user/requests/sent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sentReqs');
    });

    it('should not get received requests without a token', async () => {
      const res = await agent.get('/user/requests/received');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get received requests with a token', async () => {
      const res = await agent
        .get('/user/requests/received')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('receivedReqs');
    });

    it('should fetch the user by search', async () => {
      const res = await agent.get('/user/search?username=zyad');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('users');
    });

    it('should not update email with invalid credentials', async () => {
      const res = await agent.put('/user/email').send({
        email: 'zyad6@zyad.com',
        password: 'zyadaa',
        newEmail: 'zyad7@zyad.com',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should update email with valid credentials', async () => {
      const res = await agent.put('/user/email').send({
        email: 'zyad6@zyad.com',
        password: 'zyadzz',
        newEmail: 'zyad7@zyad.com',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not update password with invalid credentials', async () => {
      const res = await agent.put('/user/password').send({
        email: 'zyad6@zyad.com',
        password: 'zyadaa',
        newPass: 'zyadgg',
        newPassConfirm: 'zyadgg',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should update password with valid credentials', async () => {
      const res = await agent.put('/user/password').send({
        email: 'zyad7@zyad.com',
        password: 'zyadzz',
        newPass: 'zyadaa',
        newPassConfirm: 'zyadaa',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not update username with invalid credentials', async () => {
      const res = await agent.put('/user/username').send({
        email: 'zyad6@zyad.com',
        password: 'zyadaa',
        newUsername: 'zyad7',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should update username with valid credentials', async () => {
      const res = await agent.put('/user/username').send({
        email: 'zyad7@zyad.com',
        password: 'zyadaa',
        newUsername: 'zyad7',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not update bio without token', async () => {
      const res = await agent.put('/user/bio').send({
        bio: 'zyad7',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should update bio with token', async () => {
      const res = await agent
        .put('/user/bio')
        .send({
          bio: 'zyad7',
        })
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });
}
