import request from 'supertest';
import io from 'socket.io-client';
import app from '../app/index.js';

export default function (socket) {
  return describe('Testing authentication routes', () => {
    afterAll(async () => {
      await socket.close();
    });

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

    it('should not login with invalid data', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'zyad6',
        password: 'zyadzz',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'zyad6@zyad.com',
        password: 'zyadza',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should login and receive token', (done) => {
      const res = request(app)
        .post('/auth/login')
        .send({
          email: 'zyad6@zyad.com',
          password: 'zyadzz',
        })
        .then((res) => {
          expect(res.statusCode).toBe(200);
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('user');
          socket = io('http://localhost:3000', {
            auth: { token: res.body.token },
          });
          socket.on('connect', done);
        });
    });

    it('should delete the user account', (done) => {
      socket.emit(
        'user:delete',
        {
          email: 'zyad6@zyad.com',
          password: 'zyadzz',
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
