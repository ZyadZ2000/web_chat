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
import { GroupChat, PrivateChat } from '../models/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const baseURL = 'http://localhost:3000';
let userIds = [];
let reqIds = [];
let tokens = [];
let sockets = [];
let privateChatId;
let groupChatId;

export default function () {
  return describe('request events tests', () => {
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

        const user3 = new User({
          email: 'zyad8@zyad.com',
          password: hashedPassword,
          username: 'zyad8',
        });
        userIds.push(user3._id.toString());
        tokens.push(
          jwt.sign({ userId: userIds[2] }, process.env.JWT_SECRET, {
            expiresIn: '1d',
          })
        );

        const user4 = new User({
          email: 'zyad9@zyad.com',
          password: hashedPassword,
          username: 'zyad9',
        });
        userIds.push(user4._id.toString());
        tokens.push(
          jwt.sign({ userId: userIds[3] }, process.env.JWT_SECRET, {
            expiresIn: '1d',
          })
        );

        const privateChat = new PrivateChat({
          users: [user1._id, user2._id],
        });

        privateChatId = privateChat._id.toString();

        const groupChat = new GroupChat({
          creator: user1._id,
          name: 'groupChat',
          members: [user1._id, user3._id, user4._id],
          admins: [user3._id],
        });

        groupChatId = groupChat._id.toString();

        user1.chats.push(privateChat._id);
        user2.chats.push(privateChat._id);
        user1.chats.push(groupChat._id);
        user3.chats.push(groupChat._id);
        user4.chats.push(groupChat._id);
        user1.friends.push(user2._id);
        user2.friends.push(user1._id);

        await user1.save();
        await user2.save();
        await user3.save();
        await user4.save();
        await privateChat.save();
        await groupChat.save();

        // Connect the socket of the first user.
        sockets.push(await connect_socket(baseURL, tokens[0]));

        // Connect the socket of the second user.
        sockets.push(await connect_socket(baseURL, tokens[1]));

        sockets.push(await connect_socket(baseURL, tokens[2]));

        sockets.push(await connect_socket(baseURL, tokens[3]));
      } catch (error) {}
    }, 10000);

    afterAll(async () => {
      await User.deleteOne({ _id: userIds[0] });
      await User.deleteOne({ _id: userIds[1] });
      await User.deleteOne({ _id: userIds[2] });
      await User.deleteOne({ _id: userIds[3] });
      await PrivateChat.deleteOne({ _id: privateChatId });
      await GroupChat.deleteOne({ _id: groupChatId });
      sockets[0].disconnect();
      sockets[1].disconnect();
      sockets[2].disconnect();
      sockets[3].disconnect();
    });

    it('should not send a friend request to a friend', () => {
      sockets[0].emit(
        'request:sendFriend',
        { receiverId: userIds[1] },
        (res) => {
          expect(res.success).toBe(false);
          expect(res.code).toBe(400);
        }
      );
    });

    it('should send a friend request to a user who is not a friend', (done) => {
      sockets[0].emit(
        'request:sendFriend',
        { receiverId: userIds[2] },
        (res) => {
          expect(res.success).toBe(true);
        }
      );
      sockets[2].on('request:receive', (data) => {
        expect(data.type).toBe('friendRequest');
        reqIds.push(data.requestId);
        done();
      });
    });

    it('should not send a private request to a user you already have a chat with', () => {
      sockets[0].emit(
        'request:sendPrivate',
        { receiverId: userIds[1] },
        (res) => {
          expect(res.success).toBe(false);
          expect(res.code).toBe(400);
        }
      );
    });

    it('should send a private request if not in a chat', (done) => {
      sockets[2].on('request:receive', (data) => {
        expect(data.type).toBe('privateRequest');
        reqIds.push(data.requestId);
        done();
      });
      sockets[0].emit(
        'request:sendPrivate',
        { receiverId: userIds[2] },
        (res) => {
          expect(res.success).toBe(true);
        }
      );
    });
    // it('should not send a join request to a group you are already in');
    // it('should send a join request to a group you are not in');
    // it('should not send a group request if you are not admin or creator');
    // it('should send a group request if you are admin or creator');
    // it('should not send a group request to a user in the group');
    // it('should not accept a request if you are not the receiver');
    // it('should not decline a request if you are not the receiver');
    // it(
    //   'should accept a friend request if you are the receiver, and inform the other user'
    // );
    // it(
    //   'should decline a friend request if you are the receiver, and inform the other user'
    // );
    // it(
    //   'should accept a private request if you are the receiver, and inform the other user'
    // );
    // it(
    //   'should decline a private request if you are the receiver, and inform the other user'
    // );
    // it(
    //   'should accept a join request if you are the receiver, and inform the chat'
    // );
    // it('should decline a join request if you are the receiver');
    // it('should not accept a group request if not admin or creator');
    // it(
    //   'should accept a group request if admin or creator, and inform the other user'
    // );
  });
}

/**
 * test case1: you can't send a friend request to a user who's already a friend
 * test case2: you can send a friend request to a user who's not a friend
 * test case3: you can't send a private request to user you already are private with.
 * test case4: you can send a private request to a user you're not private with.
 * test case5: you can't send a join request to a group you're already in.
 * test case6: you can send a join request to a group you're not in.
 * test case7: you can't send a group request if you are not admin or creator.
 * test case8: you can send a group request if you are admin or creator.
 * test case9: you can't send a group request to a use in the group.
 * test case 10: you can't accept any request if you are not the receiver.
 * test case 11: you can't decline a request if you are not the receiver.
 * test case 12: you can accept if you are the receiver (make sure you have your scenarios ready).
 * test case 13: you can't accept or decline a join request if not creator or admin.
 * test case 14: you can accept or decline a join request if creator or admin (cover the scenario).
 *
 * So what's needed ? 4 users, two have a private chat between one another. a group chat between three where you know the creator, the members, and the admin
 */
