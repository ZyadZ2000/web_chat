// Custom Modules
import * as chatHandlers from '../handlers/chat.js';
import validate_fields from '../../utils/validation.js';
import * as validationSchemas from '../../config/joi.js';

export default function (socket) {
  socket.on('chat:join', async (data, cb) => {
    const errors = validate_fields(['chatId'], data, {
      chatId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0)
      return cb({ success: false, error: errors });

    await chatHandlers.join_chat(socket, data, cb);
  });

  socket.on('chat:sendMessage', async (data, cb) => {
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
      return cb({ success: false, error: errors });

    await chatHandlers.send_message(socket, data, cb);
  });

  socket.on('chat:addAdmin', handle_admin_add_or_remove(true));

  socket.on('chat:removeAdmin', handle_admin_add_or_remove(false));

  socket.on('chat:removeMember', async (data, cb) => {
    const errors = validate_fields(['chatId', 'memberId'], data, {
      chatId: validationSchemas.objectIdSchema,
      memberId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0)
      return cb({ success: false, error: errors });

    await chatHandlers.remove_member(socket, data, cb);
  });

  socket.on('chat:changeName', handle_change_name_or_photo(true));
  socket.on('chat:changePhoto', handle_change_name_or_photo(false));

  socket.on('chat:leave', async (data, cb) => {
    const errors = validate_fields(['chatId'], data, {
      chatId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0)
      return cb({ success: false, error: errors });

    await chatHandlers.leave_chat(socket, data, cb);
  });

  function handle_admin_add_or_remove(isAdd) {
    return async (data, cb) => {
      const errors = validate_fields(['chatId', 'adminId'], data, {
        chatId: validationSchemas.objectIdSchema,
        adminId: validationSchemas.objectIdSchema,
      });

      if (Object.keys(errors).length !== 0)
        return cb({ success: false, error: errors });

      await chatHandlers.add_or_remove_admin(socket, data, cb, isAdd);
    };
  }

  function handle_change_name_or_photo(isName) {
    return async (data, cb) => {
      const errors = validate_fields(['chatId', 'chatName'], data, {
        chatId: validationSchemas.objectIdSchema,
        chatName: validationSchemas.nameSchema,
      });

      if (Object.keys(errors).length === 0)
        return cb({ success: false, error: errors });
      await chatHandlers.change_name_or_photo(socket, data, cb, isName);
    };
  }
}
