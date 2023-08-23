import request from 'supertest';
import io from 'socket.io-client';
import app from '../app/index.js';

export default function (socket) {
  return describe('testing user routes', () => {
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

    it('should not get user data without a token', async () => {
      const res = await request(app).get('/user/profile');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get user data with a token', async () => {
      const res = await request(app)
        .get('/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should view a user profile by username', async () => {
      const res = await request(app).get('/user/view/zyad6');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should not get the user friends without the token', async () => {
      const res = await request(app).get('/user/friends');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get the user friends with the token', async () => {
      const res = await request(app)
        .get('/user/friends')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('friends');
    });

    it('should not get user chats without the token', async () => {
      const res = await request(app).get('/user/chats');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get user chats with the token', async () => {
      const res = await request(app)
        .get('/user/chats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('chats');
    });

    it('should not get sent requests without the token', async () => {
      const res = await request(app).get('/user/requests/sent');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get sent requests with the token', async () => {
      const res = await request(app)
        .get('/user/requests/sent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sentReqs');
    });

    it('should not get received requests without the token', async () => {
      const res = await request(app).get('/user/requests/received');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should get received requests with the token', async () => {
      const res = await request(app)
        .get('/user/requests/received')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('receivedReqs');
    });

    it('should fetch the user by search', async () => {
      const res = await request(app).get('/user/search?username=zyad');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('users');
    });

    it('should not update email with invalid credintials', async () => {
      const res = await request(app).put('/user/email').send({
        email: 'zyad6@zyad.com',
        password: 'zyadaa',
        newEmail: 'zyad7@zyad.com',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should update email with valid credintials', async () => {
      const res = await request(app).put('/user/email').send({
        email: 'zyad6@zyad.com',
        password: 'zyadzz',
        newEmail: 'zyad7@zyad.com',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not update password with invalid credintials', async () => {
      const res = await request(app).put('/user/password').send({
        email: 'zyad6@zyad.com',
        password: 'zyadaa',
        newPass: 'zyadgg',
        newPassConfirm: 'zyadgg',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should update password with valid credintials', async () => {
      const res = await request(app).put('/user/password').send({
        email: 'zyad7@zyad.com',
        password: 'zyadzz',
        newPass: 'zyadaa',
        newPassConfirm: 'zyadaa',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not update username with invalid credintials', async () => {
      const res = await request(app).put('/user/username').send({
        email: 'zyad6@zyad.com',
        password: 'zyadaa',
        newUsername: 'zyad7',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should update username with valid credintials', async () => {
      const res = await request(app).put('/user/username').send({
        email: 'zyad7@zyad.com',
        password: 'zyadaa',
        newUsername: 'zyad7',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not update bio without token', async () => {
      const res = await request(app).put('/user/bio').send({
        bio: 'zyad7',
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should update bio with token', async () => {
      const res = await request(app)
        .put('/user/bio')
        .send({
          bio: 'zyad7',
        })
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
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
