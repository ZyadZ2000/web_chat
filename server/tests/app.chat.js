import { connect_app, disconnect_app } from './utils/connectDisconnect.js';
import app from '../app/index';
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { GroupChat } from '../models/chat.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let userId;
let chatId;
let agent;
let server;
let token;

export default function () {
  return describe('testing chat routes', () => {
    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('zyadzz', 10);
      const user = new User({
        email: 'zyad6@zyad.com',
        username: 'zyad6',
        password: hashedPassword,
      });
      await user.save();
      userId = user._id.toString();
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
      await GroupChat.deleteOne({ _id: chatId });
      await disconnect_app(server);
    });

    it('should not create a chat without the token', async () => {
      const res = await agent.post('/chat/create').send({
        chatName: 'zyad6group',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should create the chat with the token', async () => {
      const res = await agent
        .post('/chat/create')
        .send({
          chatName: 'zyad6group',
        })
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('chat');
      chatId = res.body.chat._id.toString();
    });

    it('should not get the chat without the token', async () => {
      const res = await agent.get('/chat/').send({
        chatId: chatId,
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get the chat with the token', async () => {
      const res = await agent
        .get('/chat/')
        .send({
          chatId: chatId,
        })
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('chat');
    });

    it('should not get the chat messages without the token', async () => {
      const res = await agent.get('/chat/messages').send({
        chatId: chatId,
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get the chat messages with the token', async () => {
      const res = await agent
        .get('/chat/messages')
        .send({
          chatId: chatId,
        })
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('chat');
    });

    it('should find the chat by search', async () => {
      const res = await agent.get('/chat/search');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('chats');
    });
  });
}
