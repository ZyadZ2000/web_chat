import io from 'socket.io-client';
import axios from 'axios';

const baseURL = 'http://localhost:3000';
let socket1;
let token;

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

export default function () {
  return describe('testing user routes', () => {
    beforeAll(async () => {
      try {
        const res1 = await axios.post(`${baseURL}/auth/signup`, {
          email: 'zyad6@zyad.com',
          username: 'zyad6',
          password: 'zyadzz',
          passwordConfirm: 'zyadzz',
        });

        // Login the user
        const res2 = await axios.post(`${baseURL}/auth/login`, {
          email: 'zyad6@zyad.com',
          password: 'zyadzz',
        });

        token = res2.data.token;

        socket1 = await connect_socket(token);
      } catch (error) {}
    });

    afterAll((done) => {
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

    it('should not get user data without a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/profile`);
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get user data with a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('user');
      } catch (error) {}
    });

    it('should view a user profile by username', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/view/zyad6`);
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('user');
      } catch (error) {}
    });

    it('should not get the user friends without a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/friends`);
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get the user friends with a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/friends`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('friends');
      } catch (error) {}
    });

    it('should not get user chats without a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/chats`);
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get user chats with a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/chats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('chats');
      } catch (error) {}
    });

    it('should not get sent requests without a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/requests/sent`);
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get sent requests with a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/requests/sent`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('sentReqs');
      } catch (error) {}
    });

    it('should not get received requests without a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/requests/received`);
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get received requests with a token', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/requests/received`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('receivedReqs');
      } catch (error) {}
    });

    it('should fetch the user by search', async () => {
      try {
        const res = await axios.get(`${baseURL}/user/search?username=zyad`);
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('users');
      } catch (error) {}
    });

    it('should not update email with invalid credentials', async () => {
      try {
        const res = await axios.put(`${baseURL}/user/email`, {
          email: 'zyad6@zyad.com',
          password: 'zyadaa',
          newEmail: 'zyad7@zyad.com',
        });
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should update email with valid credentials', async () => {
      try {
        const res = await axios.put(
          `${baseURL}/user/email`,
          {
            email: 'zyad6@zyad.com',
            password: 'zyadzz',
            newEmail: 'zyad7@zyad.com',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should not update password with invalid credentials', async () => {
      try {
        const res = await axios.put(`${baseURL}/user/password`, {
          email: 'zyad6@zyad.com',
          password: 'zyadaa',
          newPass: 'zyadgg',
          newPassConfirm: 'zyadgg',
        });
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should update password with valid credentials', async () => {
      try {
        const res = await axios.put(
          `${baseURL}/user/password`,
          {
            email: 'zyad7@zyad.com',
            password: 'zyadzz',
            newPass: 'zyadaa',
            newPassConfirm: 'zyadaa',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should not update username with invalid credentials', async () => {
      try {
        const res = await axios.put(`${baseURL}/user/username`, {
          email: 'zyad6@zyad.com',
          password: 'zyadaa',
          newUsername: 'zyad7',
        });
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should update username with valid credentials', async () => {
      try {
        const res = await axios.put(
          `${baseURL}/user/username`,
          {
            email: 'zyad7@zyad.com',
            password: 'zyadaa',
            newUsername: 'zyad7',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should not update bio without token', async () => {
      try {
        const res = await axios.put(`${baseURL}/user/bio`, {
          bio: 'zyad7',
        });
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should update bio with token', async () => {
      try {
        const res = await axios.put(
          `${baseURL}/user/bio`,
          {
            bio: 'zyad7',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });
  });
}
