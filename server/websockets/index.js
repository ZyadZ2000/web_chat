import { Server } from 'socket.io';

// Custom Modules
import verifyAndCacheToken from '../utils/jwtCache.js';
import User from '../models/user.js';
import user_events from './events/user.js';
import request_events from './events/request.js';
import chat_events from './events/chat.js';

global.io;

function io_init(server) {
  global.io = new Server(server, {
    cors: {
      origin: '*',
    },
    maxHttpBufferSize: 3e7, //max of 30 MBs.
  });

  global.io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Not authenticated'));

      let decodedToken;

      decodedToken = await verifyAndCacheToken(token);

      const user = await User.findById(decodedToken.userId).select('-password');

      if (!user) return next(new Error('Not authenticated'));

      user.onlineStatus = true;

      await user.save();

      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Not authenticated'));
    }
  });

  global.io.on('connection', (socket) => {
    socket.join(socket.user._id);

    socket.user.chats.forEach((chat) => {
      socket.join(chat);
    });

    socket.use(async (_, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Not authenticated'));

        await verifyAndCacheToken(token);

        next();
      } catch (error) {
        return next(new Error('Not authenticated'));
      }
    });

    user_events(socket);
    request_events(socket);
    chat_events(socket);

    socket.on('error', (err) => {
      global.io.to(socket.id).emit('error', err.message);
      if (err.message.startsWith('Not authenticated')) socket.disconnect();
    });

    socket.on('disconnect', async () => {
      if (socket.user) {
        // Set the user to be offline
        socket.user.onlineStatus = false;
        await socket.user.save();

        global.io.emit('user:disonnected', socket.user._id);
      }

      console.log(`${socket.user?._id || 'socket'} disconnected`);
    });
  });
}

export default io_init;
