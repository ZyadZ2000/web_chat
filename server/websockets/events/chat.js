// Custom Modules
import * as chatHandlers from '../handlers/chat.js';
import validate_fields from '../../utils/validation.js';
import * as validationSchemas from '../../config/joi.js';

export default function (socket) {
  socket.on('chat:join', async (data, cb) => {
    if (typeof cb !== 'function' || typeof data !== 'object')
      return global.io.to(socket.id).emit('error', {
        error: "A 'data' object and a callback function must be provided.",
      });

    const errors = validate_fields(['chatId'], data, {
      chatId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0)
      return cb({ success: false, code: 400, error: errors });

    await chatHandlers.join_chat(socket, data, cb);
  });

  socket.on('chat:sendMessage', async (data, cb) => {
    if (typeof cb !== 'function' || typeof data !== 'object')
      return global.io.to(socket.id).emit('error', {
        error: "A 'data' object and a callback function must be provided.",
      });

    // In the case of a file it will be saved in the handler.
    const errors = validate_fields(
      ['chatId', 'messageContent', 'messageType'],
      data,
      {
        chatId: validationSchemas.objectIdSchema,
        messageContent: validationSchemas.messageContentSchema,
        messageType: validationSchemas.messageTypeSchema,
      }
    );

    if (Object.keys(errors).length !== 0)
      return cb({ success: false, code: 400, error: errors });

    await chatHandlers.send_message(socket, data, cb);
  });

  socket.on('chat:addAdmin', handle_admin_add_or_remove(true));

  socket.on('chat:removeAdmin', handle_admin_add_or_remove(false));

  socket.on('chat:removeMember', async (data, cb) => {
    if (typeof cb !== 'function' || typeof data !== 'object')
      return global.io.to(socket.id).emit('error', {
        error: "A 'data' object and a callback function must be provided.",
      });

    const errors = validate_fields(['chatId', 'memberId'], data, {
      chatId: validationSchemas.objectIdSchema,
      memberId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0)
      return cb({ success: false, code: 400, error: errors });

    await chatHandlers.remove_member(socket, data, cb);
  });

  socket.on('chat:changeName', handle_change_name_or_photo_or_description(1));
  socket.on('chat:changePhoto', handle_change_name_or_photo_or_description(2));
  socket.on(
    'chat:changeDescription',
    handle_change_name_or_photo_or_description(3)
  );

  socket.on('chat:leave', async (data, cb) => {
    if (typeof cb !== 'function' || typeof data !== 'object')
      return global.io.to(socket.id).emit('error', {
        error: "A 'data' object and a callback function must be provided.",
      });

    const errors = validate_fields(['chatId'], data, {
      chatId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0)
      return cb({ success: false, code: 400, error: errors });

    await chatHandlers.leave_chat(socket, data, cb);
  });

  function handle_admin_add_or_remove(isAdd) {
    return async (data, cb) => {
      if (typeof cb !== 'function' || typeof data !== 'object')
        return global.io.to(socket.id).emit('error', {
          error: "A 'data' object and a callback function must be provided.",
        });

      const errors = validate_fields(['chatId', 'adminId'], data, {
        chatId: validationSchemas.objectIdSchema,
        adminId: validationSchemas.objectIdSchema,
      });

      if (Object.keys(errors).length !== 0)
        return cb({ success: false, code: 400, error: errors });

      await chatHandlers.add_or_remove_admin(socket, data, cb, isAdd);
    };
  }

  function handle_change_name_or_photo_or_description(
    nameOrPhotoOrDescription
  ) {
    return async (data, cb) => {
      if (typeof cb !== 'function' || typeof data !== 'object')
        return global.io.to(socket.id).emit('error', {
          error: "A 'data' object and a callback function must be provided.",
        });

      const errors = validate_fields(
        ['chatId', 'chatName', 'chatDescription'],
        data,
        {
          chatId: validationSchemas.objectIdSchema,
          chatName: validationSchemas.notRequiredNameSchema,
          chatDescription: validationSchemas.longStringSchema,
        }
      );

      if (Object.keys(errors).length !== 0)
        return cb({ success: false, code: 400, error: errors });
      await chatHandlers.change_name_or_photo_or_description(
        socket,
        data,
        cb,
        nameOrPhotoOrDescription
      );
    };
  }
}
