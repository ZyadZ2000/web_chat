import axios from 'axios';
import io from 'socket.io-client';

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
  return describe('Chat routes', () => {
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
        { email: 'zyad6@zyad.com', password: 'zyadzz' },
        (data) => {
          socket1.disconnect();
        }
      );
      socket1.on('disconnect', () => {
        done();
      });
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        expect(res.status).toBe(201);
        expect(res.data).toHaveProperty('chat');
      } catch (error) {}
    });

    it('should not get the chat without the token', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/`);
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get the chat with the token', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('chat');
      } catch (error) {}
    });

    it('should not get the chat messages without the token', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/messages`);
        expect(res.status).toBe(401);
        expect(res.data).toHaveProperty('message');
      } catch (error) {}
    });

    it('should get the chat messages with the token', async () => {
      try {
        const res = await axios.get(`${baseURL}/chat/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
