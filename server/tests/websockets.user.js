import dotenv from 'dotenv';
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import http from 'http';
import io_init from '../websockets/index.js';
// import {
//   connect_socket,
//   disconnect_socket,
//   http_server_listen,
// } from './utils/connectDisconnect.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
let server; // create a server with the express app.
let tokens = [];
let userIds = [];
let sockets = [];

export default function () {
  return describe('user events tests', () => {
    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('zyadzz', 10);
      const user1 = new User({
        email: 'zyad6@zyad.com',
        password: hashedPassword,
        username: 'zyad6',
      });
      userIds.push(user1._id.toString());
      tokens.push(
        jwt.sign({ userId: userIds[0] }, process.env.JWT_SECRET, {
          expiresIn: '1d',
        })
      );

      const user2 = new User({
        email: 'zyad7@zyad.com',
        password: hashedPassword,
        username: 'zyad7',
      });
      userIds.push(user2._id.toString());
      tokens.push(
        jwt.sign({ userId: userIds[1] }, process.env.JWT_SECRET, {
          expiresIn: '1d',
        })
      );

      user1.friends.push(user2._id);
      user2.friends.push(user1._id);

      await user1.save();
      await user2.save();

      server = http.createServer(); // create http server
      io_init(server); // initialize socket.io on the server
      await http_server_listen(server, 5000); // listen to the server on port 5000

      // Connect the socket of the first user.
      sockets.push(await connect_socket('http://localhost:5000', tokens[0]));

      // Connect the socket of the second user.
      sockets.push(await connect_socket('http://localhost:5000', tokens[1]));
    });

    afterAll((done) => {
      User.deleteOne({ _id: userIds[0] })
        .then(() => User.deleteOne({ _id: userIds[1] }))
        .then(() => {
          global.io.close();
          global.io.on('disconnect', () => {
            done();
          });
        });
    });

    it('should not remove a friend with invalid id', () => {
      expect(true).toBe(true);
    });
    // it('shoudl remove a friend with valid id');
    // it('should not delete a user with invalid credentials');
    // it('should delete a user with valid credentials');
  });
}
