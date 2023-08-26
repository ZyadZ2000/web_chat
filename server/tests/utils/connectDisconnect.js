import io from 'socket.io-client';
import request from 'supertest';

export function connect_socket(baseURL, token) {
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

export function connect_app(app, port) {
  return new Promise((resolve, reject) => {
    let server = app.listen(port, (err) => {
      if (err) return reject(err);
      const agent = request.agent(server);
      resolve({ server, agent });
    });
  });
}

export function disconnect_app(server) {
  return new Promise((resolve, reject) => {
    if (!server) reject('No server provided');
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
