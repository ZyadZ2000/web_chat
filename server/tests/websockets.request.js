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
import Request, {
  FriendRequest,
  PrivateRequest,
  GroupChatRequest,
  JoinGroupRequest,
} from '../models/request.js';

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
let event;
let emittedData = {};
let chatJoinData = {};

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

        const user5 = new User({
          email: 'zyad10@zyad.com',
          password: hashedPassword,
          username: 'zyad10',
        });
        userIds.push(user5._id.toString());
        tokens.push(
          jwt.sign({ userId: userIds[4] }, process.env.JWT_SECRET, {
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

        const privateReq1 = new PrivateRequest({
          sender: user1._id,
          receiver: user3._id,
        });
        reqIds.push(privateReq1._id.toString());

        const privateReq2 = new PrivateRequest({
          sender: user1._id,
          receiver: user4._id,
        });
        reqIds.push(privateReq2._id.toString());

        const friendReq1 = new FriendRequest({
          sender: user1._id,
          receiver: user3._id,
        });
        reqIds.push(friendReq1._id.toString());

        const friendReq2 = new FriendRequest({
          sender: user1._id,
          receiver: user4._id,
        });
        reqIds.push(friendReq2._id.toString());

        const joinReq1 = new JoinGroupRequest({
          sender: user2._id,
          chat: groupChat._id,
        });
        reqIds.push(joinReq1._id.toString());

        const joinReq2 = new JoinGroupRequest({
          sender: user5._id,
          chat: groupChat._id,
        });
        reqIds.push(joinReq2._id.toString());

        const groupReq1 = new GroupChatRequest({
          chat: groupChat._id,
          receiver: user5._id,
        });
        reqIds.push(groupReq1._id.toString());

        const groupReq2 = new GroupChatRequest({
          chat: groupChat._id,
          receiver: user3._id,
        });
        reqIds.push(groupReq2._id.toString());

        await user1.save();
        await user2.save();
        await user3.save();
        await user4.save();
        await user5.save();
        await privateChat.save();
        await groupChat.save();
        await privateReq1.save();
        await privateReq2.save();
        await friendReq1.save();
        await friendReq2.save();
        await joinReq1.save();
        await joinReq2.save();
        await groupReq1.save();
        await groupReq2.save();

        // Connect the socket of the first user.
        sockets.push(await connect_socket(baseURL, tokens[0]));

        // Connect the socket of the second user.
        sockets.push(await connect_socket(baseURL, tokens[1]));

        sockets.push(await connect_socket(baseURL, tokens[2]));

        sockets.push(await connect_socket(baseURL, tokens[3]));

        sockets.push(await connect_socket(baseURL, tokens[4]));

        sockets[0].on('chat:join', (data) => {
          chatJoinData.user = data.user;
        });

        sockets[0].on('request:accept', (data) => {
          emittedData.type = data.type;
          event = 'request:accept';
          return;
        });

        sockets[0].on('request:decline', (data) => {
          emittedData.type = data.type;
          event = 'request:decline';
          return;
        });

        sockets[2].on('request:receive', (data) => {
          emittedData.type = data.type;
          return reqIds.push(data.requestId);
        });

        sockets[1].on('request:receive', (data) => {
          emittedData.type = data.type;
          return reqIds.push(data.requestId);
        });

        sockets[1].on('request:accept', (data) => {
          emittedData.type = data.type;
          emittedData.chat = data.chat;
          event = 'request:accept';
          return;
        });

        sockets[4].on('request:decline', (data) => {
          emittedData.type = data.type;
          emittedData.chat = data.chat;
          event = 'request:decline';
          return;
        });
      } catch (error) {}
    }, 20000);

    afterAll(async () => {
      await User.deleteMany({ _id: { $in: userIds } });
      await PrivateChat.deleteOne({ _id: privateChatId });
      await GroupChat.deleteOne({ _id: groupChatId });
      await Request.deleteMany({ _id: { $in: reqIds } });
      sockets[0].disconnect();
      sockets[1].disconnect();
      sockets[2].disconnect();
      sockets[3].disconnect();
      sockets[4].disconnect();
    }, 15000);

    it('should not send a friend request to a friend', (done) => {
      sockets[0].emit(
        'request:sendFriend',
        { receiverId: userIds[1] },
        (res) => {
          expect(res.success).toBe(false);
          expect(res.code).toBe(400);
          return done();
        }
      );
    });

    it('should send a friend request to a user who is not a friend', (done) => {
      sockets[0].emit(
        'request:sendFriend',
        { receiverId: userIds[2] },
        (res) => {
          expect(res.success).toBe(true);
          return setTimeout(() => {
            expect(emittedData.type).toBe('friendRequest');
            return done();
          }, 500);
        }
      );
    });

    it('should not send a private request to a user you already have a chat with', (done) => {
      sockets[0].emit(
        'request:sendPrivate',
        { receiverId: userIds[1] },
        (res) => {
          expect(res.success).toBe(false);
          expect(res.code).toBe(400);
          return done();
        }
      );
    });

    it('should send a private request if not in a chat', (done) => {
      sockets[0].emit(
        'request:sendPrivate',
        { receiverId: userIds[2] },
        (res) => {
          expect(res.success).toBe(true);
          return setTimeout(() => {
            expect(emittedData.type).toBe('privateRequest');
            return done();
          }, 500);
        }
      );
    });

    it('should not send a join request to a group you are already in', (done) => {
      sockets[2].emit('request:sendJoin', { chatId: groupChatId }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(400);
        return done();
      });
    });

    it('should send a join request to a group you are not in', (done) => {
      sockets[1].emit('request:sendJoin', { chatId: groupChatId }, (res) => {
        expect(res.success).toBe(true);
        return setTimeout(() => {
          expect(emittedData.type).toBe('joinRequest');
          return done();
        }, 500);
      });
    });

    it('should not send a group request if you are not admin or creator', (done) => {
      sockets[3].emit(
        'request:sendGroup',
        {
          receiverId: userIds[1],
          chatId: groupChatId,
        },
        (res) => {
          expect(res.success).toBe(false);
          expect(res.code).toBe(402);
          return done();
        }
      );
    });

    it('should send a group request if you are admin or creator', (done) => {
      sockets[0].emit(
        'request:sendGroup',
        {
          receiverId: userIds[1],
          chatId: groupChatId,
        },
        (res) => {
          expect(res.success).toBe(true);
          return setTimeout(() => {
            expect(emittedData.type).toBe('groupRequest');
            return done();
          }, 3000);
        }
      );
    }, 10000);

    it('should not send a group request to a user in the group', (done) => {
      sockets[0].emit(
        'request:sendGroup',
        {
          receiverId: userIds[2],
          chatId: groupChatId,
        },
        (res) => {
          expect(res.success).toBe(false);
          expect(res.code).toBe(400);
          return done();
        }
      );
    });

    it('should not decline a private request if you are not the receiver', (done) => {
      sockets[0].emit('request:decline', { requestId: reqIds[0] }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(401);
        return done();
      });
    });
    it('should not accept a private request if you are not the receiver', (done) => {
      sockets[0].emit('request:accept', { requestId: reqIds[0] }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(401);
        return done();
      });
    });

    it('should accept a private request if you are the receiver, and inform the other user', (done) => {
      sockets[2].emit('request:accept', { requestId: reqIds[0] }, (res) => {
        expect(res.success).toBe(true);
        expect(res).toHaveProperty('chat');
        return setTimeout(() => {
          expect(emittedData.type).toBe('privateRequest');
          expect(event).toBe('request:accept');
          return done();
        }, 500);
      });
    });

    it('should decline a private request if you are the receiver, and inform the other user', (done) => {
      sockets[3].emit('request:decline', { requestId: reqIds[1] }, (res) => {
        expect(res.success).toBe(true);
        return setTimeout(() => {
          expect(emittedData.type).toBe('privateRequest');
          expect(event).toBe('request:decline');
          return done();
        }, 500);
      });
    });

    it('should not decline a friend request if you are not the receiver', (done) => {
      sockets[0].emit('request:decline', { requestId: reqIds[2] }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(401);
        return done();
      });
    });

    it('should not accept a friend request if you are not the receiver', (done) => {
      sockets[0].emit('request:accept', { requestId: reqIds[2] }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(401);
        return done();
      });
    });

    it('should accept a friend request if you are the receiver, and inform the other user', (done) => {
      sockets[2].emit('request:accept', { requestId: reqIds[2] }, (res) => {
        expect(res.success).toBe(true);
        return setTimeout(() => {
          expect(emittedData.type).toBe('friendRequest');
          expect(event).toBe('request:accept');
          return done();
        }, 500);
      });
    });

    it('should decline a friend request if you are the receiver, and inform the other user', (done) => {
      sockets[3].emit('request:decline', { requestId: reqIds[3] }, (res) => {
        expect(res.success).toBe(true);
        return setTimeout(() => {
          expect(emittedData.type).toBe('friendRequest');
          expect(event).toBe('request:decline');
          return done();
        }, 500);
      });
    });

    it('should not accept a join request if not admin or creator', (done) => {
      sockets[3].emit('request:accept', { requestId: reqIds[4] }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(401);
        return done();
      });
    });

    it('should not decline a join request if not admin or creator', (done) => {
      sockets[3].emit('request:decline', { requestId: reqIds[4] }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(401);
        return done();
      });
    });

    it('should accept a join request if you are admin or creator, and inform the sender', (done) => {
      sockets[0].emit('request:accept', { requestId: reqIds[4] }, (res) => {
        expect(res.success).toBe(true);
        return setTimeout(() => {
          expect(emittedData.type).toBe('joinRequest');
          expect(emittedData.chat).toHaveProperty('name');
          expect(event).toBe('request:accept');
          expect(chatJoinData.user).toHaveProperty('username');
          return done();
        }, 500);
      });
    });

    it('should decline a join request if you are admin or creator and inform the sender', (done) => {
      sockets[2].emit('request:decline', { requestId: reqIds[5] }, (res) => {
        expect(res.success).toBe(true);
        return setTimeout(() => {
          expect(emittedData.type).toBe('joinRequest');
          expect(event).toBe('request:decline');
          return done();
        }, 500);
      });
    });

    it('should not accept a group request if not receiver', (done) => {
      sockets[0].emit('request:accept', { requestId: reqIds[6] }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(401);
        return done();
      });
    });
    it('should not decline a group request if not receiver', (done) => {
      sockets[0].emit('request:decline', { requestId: reqIds[6] }, (res) => {
        expect(res.success).toBe(false);
        expect(res.code).toBe(401);
        return done();
      });
    });
    it('should accept a group request if receiver and inform the chat', (done) => {
      sockets[4].emit('request:accept', { requestId: reqIds[6] }, (res) => {
        expect(res.success).toBe(true);
        expect(res).toHaveProperty('chat');
        return setTimeout(() => {
          expect(chatJoinData.user.username).toBe('zyad10');
          return done();
        }, 500);
      });
    });

    it('should decline a group request if receiver', (done) => {
      sockets[2].emit('request:decline', { requestId: reqIds[7] }, (res) => {
        expect(res.success).toBe(true);
        return done();
      });
    });
  });
}
