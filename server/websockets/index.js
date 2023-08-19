// NPM Packages
import { Server } from 'socket.io';

// Custom Modules
import verify_and_cache_token from '../utils/jwtCache.js';
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

  // Middleware to authenticate the user upon connection
  global.io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('Not authenticated');

      let decodedToken;

      decodedToken = await verify_and_cache_token(token);

      const user = await User.findById(decodedToken.userId).select(
        '-password -friends'
      );

      if (!user) throw new Error('Not authenticated');

      user.onlineStatus = true;

      await user.save();

      socket.user = user;
      next();
    } catch (error) {
      return next(error);
    }
  });

  global.io.on('connection', (socket) => {
    //socket joins a room with the same id as the user id
    socket.join(socket.user.id);

    // Join the user to all of his chats
    socket.user.chats.forEach((chat) => {
      socket.join(chat.toString());
    });

    socket.use(async (_, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) throw new Error('Not authenticated');

        await verify_and_cache_token(token);

        next();
      } catch (error) {
        return next(error);
      }
    });

    // Register all the events
    user_events(socket);
    request_events(socket);
    chat_events(socket);

    // Handle errors that might arise during middleware execution
    socket.on('error', (err) => {
      global.io.to(socket.id).emit('error', err.message);
      if (err.message.startsWith('Not authenticated')) socket.disconnect();
    });

    socket.on('disconnect', async () => {
      if (socket.user) {
        // Set the user to be offline
        await socket.user.updateOne({ onlineStatus: false });

        //inform all connected sockets of user disconnection
        global.io.emit('user:disonnected', socket.user.username);
      }

      console.log(`${socket.id || 'socket'} disconnected`);
    });
  });
}

export default io_init;
