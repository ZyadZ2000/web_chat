// Custom Modules
import * as requestHandlers from '../handlers/request.js';
import validate_fields from '../../utils/validation.js';
import * as validationSchemas from '../../config/joi.js';

export default function (socket) {
  socket.on(
    'request:sendPrivate',
    handle_send_private_or_friend_request(true /* sending a private request */)
  );

  socket.on(
    'request:sendFriend',
    handle_send_private_or_friend_request(false /* sending a friend request */)
  );

  socket.on('request:sendJoin', handle_send_group_or_join_request(false));

  socket.on('request:sendGroup', handle_send_group_or_join_request(true));

  socket.on(
    'request:accept',
    handle_accept_or_decline_request(true /* to accept the request */)
  );

  socket.on(
    'request:decline',
    handle_accept_or_decline_request(false /* to decline the request */)
  );

  // Private Functions
  function handle_accept_or_decline_request(isAccept) {
    return async (data, cb) => {
      if (typeof cb !== 'function' || typeof data !== 'object')
        return global.io.to(socket.id).emit('error', {
          error: "A 'data' object and a callback function must be provided.",
        });

      const errors = validate_fields(['requestId'], data, {
        requestId: validationSchemas.objectIdSchema,
      });

      if (Object.keys(errors).length !== 0) {
        return cb({ success: false, error: errors });
      }

      await requestHandlers.accept_or_decline_request(
        socket,
        data,
        cb,
        isAccept
      );
    };
  }

  function handle_send_private_or_friend_request(isPrivate) {
    return async (data, cb) => {
      if (typeof cb !== 'function' || typeof data !== 'object')
        return global.io.to(socket.id).emit('error', {
          error: "A 'data' object and a callback function must be provided.",
        });

      const errors = validate_fields(['receiverId'], data, {
        receiverId: validationSchemas.objectIdSchema,
      });

      if (Object.keys(errors).length !== 0) {
        return cb({ success: false, errors });
      }

      await requestHandlers.send_private_or_friend_request(
        socket,
        data,
        cb,
        isPrivate
      );
    };
  }

  function handle_send_group_or_join_request(isGroup) {
    return async (data, cb) => {
      if (typeof cb !== 'function' || typeof data !== 'object')
        return global.io.to(socket.id).emit('error', {
          error: "A 'data' object and a callback function must be provided.",
        });

      const errors = isGroup
        ? validate_fields(['chatId', 'receiverId'], data, {
            chatId: validationSchemas.objectIdSchema,
            receiverId: validationSchemas.objectIdSchema,
          })
        : validate_fields(['chatId'], data, {
            chatId: validationSchemas.objectIdSchema,
          });

      if (Object.keys(errors).length !== 0) {
        return cb({ success: false, errors });
      }

      await requestHandlers.send_group_or_join_request(
        socket,
        data,
        cb,
        isGroup
      );
    };
  }
}
