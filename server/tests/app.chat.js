// NPM Packages
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Node Modules
import { fileURLToPath } from 'url';
import path from 'path';

// Custom Modules
import User from '../models/user.js';
import { GroupChat } from '../models/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const baseURL = 'http://localhost:3000';

let userId;
let chatId;
let token;

export default function () {
  return describe('testing chat routes', () => {
    beforeAll(async () => {
      try {
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
      } catch (error) {}
    });

    afterAll(async () => {
      try {
        await User.deleteOne({ _id: userId });
        await GroupChat.deleteOne({ _id: chatId });
      } catch (error) {}
    });

    it('should not create a chat without the token', async () => {
      try {
        const res = await axios.post(`${baseURL}/chat/create`, {
          chatName: 'zyad6group',
        });
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should create the chat with the token', async () => {
      try {
        const res = await axios.post(
          `${baseURL}/chat/create`,
          {
            chatName: 'zyad6group',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        expect(res.status).toBe(201);
        expect(res.data).toHaveProperty('chat');
        chatId = res.data.chat._id.toString();
      } catch (error) {}
    });

    it('should not get the chat without the token', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/`, {
          params: { chatId: chatId },
        });
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get the chat with the token', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/`, {
          params: { chatId: chatId },
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('chat');
      } catch (error) {}
    });

    it('should not get the chat messages without the token', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/messages`, {
          params: { chatId: chatId },
        });
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get the chat messages with the token', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/messages`, {
          params: { chatId: chatId },
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('chat');
      } catch (error) {}
    });

    it('should find the chat by search', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/search`);
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('chats');
      } catch (error) {}
    });
  });
}
