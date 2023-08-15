import * as requestHandlers from '../handlers/request.js';
import validate_fields from '../../utils/validation.js';
import validationSchemas from '../../config/joi.js';

export default function (socket) {
  socket.on('request:accept', async (data, cb) => {
    const errors = validate_fields(['requestId'], data, {
      requestId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0) {
      return cb({ success: false, errors });
    }

    await requestHandlers.accept_request(socket, data, cb);
  });

  socket.on('request:decline', async (data, cb) => {
    const errors = validate_fields(['requestId'], data, {
      requestId: validationSchemas.objectIdSchema,
    });

    if (Object.keys(errors).length !== 0) {
      return cb({ success: false, errors });
    }

    await requestHandlers.decline_request(socket, data, cb);
  });
}
