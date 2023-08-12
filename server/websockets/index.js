import { Socket, Server } from 'socket.io';

function io_init(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
}

export default io_init;
