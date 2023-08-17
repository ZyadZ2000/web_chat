import * as chatHandlers from '../handlers/chat.js';
import validate_fields from '../../utils/validation.js';
import validationSchemas from '../../config/joi.js';
export default function (socket) {
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

    if (Object.keys(errors).length === 0)
      return cb({ success: false, error: errors });

    await chatHandlers.send_message(socket, data, cb);
  });

  socket.on('chat:addAdmin');
  socket.on('chat:removeAdmin');
  socket.on('chat:removeMember');
  socket.on('chat:changeName');
  socket.on('chat:changePhoto');
  socket.on('chat:leave');
  socket.on('chat:delete');
}
