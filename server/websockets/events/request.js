import * as requestHandlers from '../handlers/request.js';
import validate_fields from '../../utils/validation.js';
import validationSchemas from '../../config/joi.js';

/*
  Implement events for request sending, accepting and declining.
  for sending I will have separate event endpoints on the server, but only one event the front-end
  needs to listen to.
*/
export default function (socket) {
  socket.on('request:send:private');

  socket.on('request:send:group');

  socket.on('request:send:join');

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
