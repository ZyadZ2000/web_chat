import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromFile } from 'file-type';

// Node modules
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import Chat from '../../models/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function send_message(socket, data, cb) {
  try {
    const { messageContent, messageType, chatId, file } = data;
    const chat = await Chat.aggregate([
      {
        $match: { _id: chatId },
      },
      {
        $addFields: {
          isMember: {
            $cond: {
              if: { $in: [socket.user._id, '$members'] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          isMember: 1,
        },
      },
    ]);

    if (!chat) throw new Error('Chat not found');
    if (!chat.isMember) throw new Error('Not authorized');

    switch (messageType) {
      case 'file':
        if (!file) throw new Error('No file provided');

        //check its type by calling get_valid_file_type();
        const detectedFileType = get_valid_file_type(file);

        //write it to disk, give the path of the file in the message.
        const fileName = `${uuidv4()}.${detectedFileType}`;
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'public',
          'assets',
          fileName
        );

        const writeStream = fs.createWriteStream(filePath);

        writeStream.on('finish', async () => {
          const message = {
            type: 'media',
            sender: socket.user._id,
            content: fileName,
          };
          await chat.updateOne({
            $push: {
              messages: message,
            },
          });

          cb({ success: true, message });

          return global.io.to(chat._id).emit('chat:sendMessage', {
            message: message,
            by: {
              _id: socket.user._id,
              username: socket.user.username,
            },
          });
        });

        writeStream.write(data.buffer);
        writeStream.end();
        break;
      case 'text':
        if (!messageContent)
          throw new Error('Message content must be provided');
        //set it in the message object
        const message = {
          type: 'text',
          sender: socket.user._id,
          content: messageContent,
        };
        return global.io.to(chat._id).emit('chat:sendMessage', {
          message: message,
          by: {
            _id: socket.user._id,
            username: socket.user.username,
          },
        });
        break;
    }
  } catch (error) {
    return cb({ success: false, error });
  }
}
