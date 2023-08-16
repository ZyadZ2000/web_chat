import * as requestHandlers from '../handlers/request.js';
import validate_fields from '../../utils/validation.js';
import validationSchemas from '../../config/joi.js';

function handle_request(isAccept) {
  return async (data, cb) => {
    const errors = validate_fields(['requestId'], data, {
      requestId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0) {
      return cb({ success: false, errors });
    }

    await requestHandlers.accept_or_decline_request(socket, data, cb, isAccept);
  };
}

function private_or_friend_request(isPrivate) {
  return async (data, cb) => {
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

export default function (socket) {
  socket.on(
    'request:send:private',
    private_or_friend_request(true /* sending a private request */)
  );

  socket.on(
    'request:send:friend',
    private_or_friend_request(false /* sending a friend request */)
  );

  socket.on('request:send:group', async (data, cb) => {
    const errors = validate_fields(['receiverId', 'chatId'], data, {
      chatId: validationSchemas.objectIdSchema,
      receiverId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0) {
      return cb({ success: false, errors });
    }

    await requestHandlers.send_group_or_join_request(
      socket,
      data,
      cb,
      true /* to indicate it's a group request */
    );
  });

  socket.on('request:send:join', async (data, cb) => {
    const errors = validate_fields(['chatId'], data, {
      chatId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0) {
      return cb({ success: false, errors });
    }
    await requestHandlers.send_group_or_join_request(
      socket,
      data,
      cb,
      false /* to indicate it's a join request */
    );
  });

  socket.on('request:accept', handle_request(true /* to accept the request */));

  socket.on(
    'request:decline',
    handle_request(false /* to decline the request */)
  );
}
