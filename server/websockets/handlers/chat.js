// NPM Packages
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import mongoose from 'mongoose';

// Node modules
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Custom Modules
import Chat from '../../models/chat.js';
import User from '../../models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function join_chat(socket, data, cb) {
  try {
    const { chatId } = data;

    const chat = await Chat.findOne({
      _id: chatId,
      members: socket.user._id,
    }).select('_id');

    if (!chat) throw new Error('Not authorized');

    socket.join(chat.id);

    return cb({ success: true });
  } catch (error) {
    return cb({ success: false, error });
  }
}

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
        const detectedFileType = await fileTypeFromBuffer(file);

        if (
          detectedFileType.ext !== 'png' &&
          detectedFileType.ext !== 'jpg' &&
          detectedFileType.ext !== 'mp4' &&
          detectedFileType.ext !== 'mp3'
        )
          throw new Error('Invalid file type');
        //write it to disk, give the path of the file in the message.
        const fileName = `${uuidv4()}.${detectedFileType.ext}`;
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
            type: 'file',
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

export async function add_or_remove_admin(socket, data, cb, isAdd) {
  try {
    const { chatId, adminId } = data;

    const admin = await User.findById(adminId).select('_id');

    if (!admin) throw new Error('User not found');

    const chat = await Chat.aggregate([
      {
        $match: { _id: chatId },
      },
      {
        $addFields: {
          isCreator: {
            $cond: {
              if: { $eq: ['$creator', socket.user._id] },
              then: true,
              else: false,
            },
          },
          isAdmin: {
            $cond: {
              if: {
                $in: [admin._id, '$admins'],
              },
              then: true,
              else: false,
            },
          },
        },
      },
    ]);

    if (!chat) throw new Error('Chat not found');
    if (!chat.isCreator) throw new Error('Not authorized');
    if (!chat.isAdmin && !isAdd) throw new Error('User is not an admin');
    if (chat.isAdmin && isAdd) throw new Error('User is already an admin');

    if (isAdd) {
      chat.updateOne({ $push: { admins: admin._id } });
    } else {
      chat.updateOne({ $pull: { admins: admin._id } });
    }

    cb({ success: true });

    return global.io
      .to(chat._id)
      .emit(isAdd ? 'chat:addAdmin' : 'chat:removeAdmin', {
        admin: { _id: admin._id, username: admin.username },
      });
  } catch (error) {
    return cb({ success: false, error });
  }
}

export async function remove_member(socket, data, cb) {
  const session = await mongoose.startSession();
  session.abortTransaction();
  try {
    const { chatId, memberId } = data;

    const member = await User.findById(memberId).select('_id chats');

    if (!member) throw new Error('User not found');

    const chat = await Chat.aggregate([
      {
        $match: { _id: chatId },
      },
      {
        $addFields: {
          isRequestorCreator: {
            $cond: {
              if: { $eq: ['$creator', socket.user._id] },
              then: true,
              else: false,
            },
          },
          isRequestorAdmin: {
            $cond: {
              if: { $in: [socket.user._id, '$admins'] },
              then: true,
              else: false,
            },
          },
          isOtherUserMember: {
            $cond: {
              if: { $in: [member._id, '$members'] },
              then: true,
              else: false,
            },
          },
          isOtherUserAdmin: {
            $cond: {
              if: { $in: [member._id, '$admins'] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          creator: 1,
          isRequestorCreator: 1,
          isRequestorAdmin: 1,
          isOtherUserMember: 1,
          isOtherUserAdmin: 1,
        },
      },
    ]);

    if (member._id === chat.creator) throw new Error('Cannot remove creator');
    if (!chat) throw new Error('Chat not found');
    if (!chat.isRequestorCreator && !chat.isRequestorAdmin)
      throw new Error('Not authorized');
    if (!chat.isOtherUserMember) throw new Error('User is not a member');

    if (chat.isRequestorAdmin && chat.isOtherUserAdmin)
      throw new Error('Only the creator can remove admins');

    if (chat.isOtherUserAdmin) {
      chat
        .updateOne({
          $pull: { members: member._id },
          $pull: { admins: member._id },
        })
        .session(session);
    } else {
      chat.updateOne({ $pull: { members: member._id } }).session(session);
    }
    member.updateOne({ $pull: { chats: chat._id } }).session(session);

    await session.commitTransaction();
    session.endSession();

    cb({ success: true });

    /* Disconnect the socket of the member from the chat._id */

    return global.io.to(chat._id).emit('chat:removeMember', {
      member: { _id: member._id, username: member.username },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error });
  }
}

export async function leave_chat(socket, data, cb) {
  const session = await mongoose.startSession();
  session.abortTransaction();
  try {
    const { chatId } = data;
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
          isAdmin: {
            $cond: {
              if: { $in: [socket.user._id, '$admins'] },
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
          isAdmin: 1,
        },
      },
    ]);

    if (!chat) throw new Error('Chat not found');
    if (!chat.isMember) throw new Error('Already not a member');

    if (chat.isAdmin) {
      chat
        .updateOne({
          $pull: { members: member._id },
          $pull: { admins: member._id },
        })
        .session(session);
    } else {
      chat.updateOne({ $pull: { members: socket.user._id } }).session(session);
    }

    socket.user.updateOne({ $pull: { chats: chat._id } }).session(session);

    await session.commitTransaction();
    session.endSession();

    cb({ success: true });

    /* Disconnect the socket of the member from the chat._id */

    return global.io.to(chat._id).emit('chat:leave', {
      member: { _id: socket.user._id, username: socket.user.username },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error });
  }
}

export async function change_name_or_photo(socket, data, cb, isName) {
  try {
    const { chatId, chatName, file } = data;
    const chat = await Chat.aggregate([
      {
        $match: { _id: chatId },
      },
      {
        $addFields: {
          isCreator: {
            $cond: {
              if: { $eq: ['$creator', socket.user._id] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          isCreator: 1,
        },
      },
    ]);

    if (!chat) throw new Error('Chat not found');
    if (!chat.isCreator) throw new Error('Not authorized');

    if (isName) {
      await chat.updateOne({ $set: { name: chatName } });
      cb({ success: true });
      return global.io.to(chat._id).emit('chat:changeName', { name: chatName });
    } else {
      if (!file) throw new Error('No file provided');
      const fileType = await fileTypeFromBuffer(file);
      if (fileType.ext !== 'png' && fileType.ext !== 'jpg')
        throw new Error('Invalid file type');

      const fileName = `${uuidv4()}.${fileType.ext}`;
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
        await chat.updateOne({
          $set: {
            photo: fileName,
          },
        });

        cb({ success: true });

        return global.io.to(chat._id).emit('chat:changePhoto', {
          photo: fileName,
        });
      });

      writeStream.write(data.buffer);
      writeStream.end();
    }
  } catch (error) {
    return cb({ success: false, error });
  }
}
