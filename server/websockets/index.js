import { Server } from 'socket.io';
import verifyAndCacheToken from '../utils/jwtCache.js';
import User from '../models/user.js';

/*
  Error handling with callbacks
  I need to concern myself with registering and successfully, and consistently, handle events

*/
function io_init(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Not authenticated'));

      let decodedToken;

      decodedToken = await verifyAndCacheToken(token);

      socket.userId = decodedToken.userId;

      // Set the user to be online
      await User.updateOne(
        { _id: decodedToken.userId },
        { $set: { onlineStatus: true } }
      );
      next();
    } catch (error) {
      return next(new Error('Not authenticated'));
    }
  });

  io.on('connection', () => {
    socket.join(socket.userId);

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

    socket.on('error', (err) => {
      io.to(socket.id).emit('error', err.message);
      if (err.message.startsWith('Not authenticated')) socket.disconnect();
    });

    socket.on('disconnect', async () => {
      socket.userId
        ? await User.updateOne(
            { _id: socket.userId },
            { $set: { onlineStatus: false } }
          )
        : null;
      console.log('user disconnected');
    });
  });
}

export default io_init;
