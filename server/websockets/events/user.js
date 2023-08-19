// Custom Modules
import * as userHandlers from '../handlers/user.js';
import validate_fields from '../../utils/validation.js';
import * as validationSchemas from '../../config/joi.js';

export default function (socket) {
  socket.on('user:removeFriend', async (data, cb) => {
    const errors = validate_fields(['friendId'], data, {
      friendId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0) {
      return cb({ success: false, error: errors });
    }

    await userHandlers.remove_friend(socket, data, cb);
  });

  socket.on('user:delete', async (data, cb) => {
    const errors = validate_fields(['email', 'password'], data, {
      email: validationSchemas.objectIdSchema,
      password: validationSchemas.passwordSchema,
    });

    if (Object.keys(errors).length !== 0) {
      return cb({ success: false, error: errors });
    }

    await userHandlers.delete_user(socket, data, cb);
  });
}
