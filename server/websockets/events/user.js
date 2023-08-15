import * as userHandlers from '../handlers/user.js';
import validate_fields from '../../utils/validation.js';
import validationSchemas from '../../config/joi.js';

export default function (socket) {
  socket.on('user:removeFriend', async (data, cb) => {
    const errors = validate_fields(['friendId'], data, {
      friendId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0) {
      return cb({ success: false, errors });
    }

    await userHandlers.remove_friend(socket, data, cb);
  });
}