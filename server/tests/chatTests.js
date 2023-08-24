import request from 'supertest';
import io from 'socket.io-client';
import app from '../app/index.js';

export default function (socket) {
  return describe('Chat routes', () => {
    let token;
    beforeAll(async () => {
      // Sign up a new user
      const res = await request(app).post('/auth/signup').send({
        email: 'zyad6@zyad.com',
        username: 'zyad6',
        password: 'zyadzz',
        passwordConfirm: 'zyadzz',
      });

      // Login the user

      const res2 = await request(app).post('/auth/login').send({
        email: 'zyad6@zyad.com',
        password: 'zyadzz',
      });

      token = res2.body.token;
    });

    it('should not create a chat without the token', async () => {
      const res = await request(app).post('/chat/create').send({
        chatName: 'zyad6group',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProberty('message');
    });

    it('should create the chat with the token', async () => {
      const res = await request(app)
        .post('/chat/create')
        .send({
          chatName: 'zyad6group',
        })
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProberty('chat');
    });

    it('should not get the chat without the token', async () => {
      const res = await request(app).get('/chat/');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProberty('message');
    });

    it('should get the chat with the token', async () => {
      const res = await request(app)
        .get('/chat/')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProberty('chat');
    });

    it('should not get the chat messages without the token', async () => {
      const res = await request(app).get('/chat/messages');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProberty('message');
    });

    it('should get the chat messages with the token', async () => {
      const res = await request(app)
        .get('/chat/messages')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProberty('chat');
    });

    it('should find the chat by search', async () => {
      const res = await request(app).get('/chat/search');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProberty('chats');
    });

    it('should connect to socket.io', (done) => {
      socket = io('http://localhost:3000', {
        auth: {
          token,
        },
      });
      socket.on('connect', done);
    });

    it('should delete the user account', (done) => {
      socket.emit(
        'user:delete',
        {
          email: 'zyad7@zyad.com',
          password: 'zyadaa',
        },
        (data) => {
          expect(data).toHaveProperty('success');
          expect(data.success).toBe(true);
          done();
        }
      );
    });
  });
}
