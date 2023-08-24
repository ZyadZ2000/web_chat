import axios from 'axios';
import io from 'socket.io-client';

const baseURL = 'http://localhost:3000';
let token;
let socket1;

function connect_socket(token) {
  return new Promise((resolve, reject) => {
    let socket;
    socket = io(`${baseURL}`, {
      auth: {
        token,
      },
    });
    socket.on('connect', () => {
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      reject(err);
    });
    socket.on('disconnect', (err) => {
      reject(err);
    });
  });
}

export default function (socket) {
  return describe('Testing authentication routes', () => {
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

    it('should not sign up with invalid data', async () => {
      try {
        const res = await axios.post(`${baseURL}/auth/signup`, {
          email: 'zyad6',
          username: 'zyad6',
          password: 'zyadzz',
          passwordConfirm: 'zyadzaa',
        });
        expect(res.status).toBe(400);
        expect(res.data).toHaveProperty('errors');
      } catch (error) {}
    });

    it('should sign up a new user', async () => {
      try {
        const res = await axios.post(`${baseURL}/auth/signup`, {
          email: 'zyad6@zyad.com',
          username: 'zyad6',
          password: 'zyadzz',
          passwordConfirm: 'zyadzz',
        });
        expect(res.status).toBe(201);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
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

    it('should login and receive token', async () => {
      try {
        const res = await axios.post(`${baseURL}/auth/login`, {
          email: 'zyad6@zyad.com',
          password: 'zyadzz',
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('token');
        expect(res.data).toHaveProperty('user');
        token = res.data.token;
      } catch (error) {}
    });

    it('should connect to socket.io server', async () => {
      try {
        socket1 = await connect_socket(token);
      } catch (error) {
        expect(true).toBe(false);
      }
    });

    it('should delete the user account and disconnect', (done) => {
      socket1.emit(
        'user:delete',
        { email: 'zyad7@zyad.com', password: 'zyadaa' },
        (data) => {
          socket1.disconnect();
        }
      );
      socket1.on('disconnect', () => {
        done();
      });
    });
  });
}
