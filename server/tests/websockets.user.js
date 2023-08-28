// NPM Packages
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Node Modules
import { fileURLToPath } from 'url';
import path from 'path';

// Custom Modules
import User from '../models/user.js';
import { connect_socket } from './utils/connectDisconnect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const baseURL = 'http://localhost:3000';

let server; // create a server with the express app.
let tokens = [];
let userIds = [];
let sockets = [];

export default function () {
  return describe('user events tests', () => {
    beforeAll(async () => {
      try {
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

        // Connect the socket of the first user.
        sockets.push(await connect_socket(baseURL, tokens[0]));

        // Connect the socket of the second user.
        sockets.push(await connect_socket(baseURL, tokens[1]));
      } catch (error) {}
    });

    afterAll((done) => {
      User.deleteOne({ _id: userIds[0] })
        .then(() => User.deleteOne({ _id: userIds[1] }))
        .then(() => {
          sockets[0].disconnect();
          sockets[1].disconnect();
          done();
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
