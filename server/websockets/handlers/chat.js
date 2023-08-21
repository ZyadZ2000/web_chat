// NPM Packages
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import mongoose from 'mongoose';

// Node modules
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Custom Modules
import Chat, { GroupChat } from '../../models/chat.js';
import User from '../../models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function join_chat(socket, data, cb) {
  try {
    const { chatId } = data;

    let chat = await Chat.aggregate([
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

    chat = chat[0];

    if (!chat) throw new Error('Chat not found');
    if (!chat.isMember) throw new Error('Not authorized');

    socket.join(chat._id.toString());

    return cb({ success: true });
  } catch (error) {
    return cb({ success: false, error: error.message });
  }
}

export async function send_message(socket, data, cb) {
  try {
    const { messageContent, messageType, file } = data;
    const chatId = new mongoose.Types.ObjectId(data.chatId);

    let chat = await Chat.aggregate([
      {
        $match: { _id: chatId },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          isMember: {
            $cond: {
              if: { $eq: ['$type', 'groupChat'] }, // Check if the chat type is 'groupChat'
              then: { $in: [socket.user._id, '$members'] }, // Check if userId is in members array
              else: { $in: [socket.user._id, '$users'] }, // Check if userId is in users array for 'privateChat'
            },
          },
        },
      },
    ]);

    chat = chat[0];

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

        writeStream.on('finish', async (err) => {
          if (err) return cb({ success: false, error: err.message });
          const message = {
            type: 'file',
            sender: socket.user._id,
            content: fileName,
          };
          await Chat.updateOne(
            { _id: chat._id },
            {
              $push: {
                messages: message,
              },
            }
          );

          cb({ success: true, message });

          return global.io.to(chat._id.toString()).emit('chat:sendMessage', {
            message: message,
            by: {
              _id: socket.user._id,
              username: socket.user.username,
            },
          });
        });

        writeStream.write(data.file);
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

        await Chat.updateOne(
          { _id: chat._id },
          {
            $push: {
              messages: message,
            },
          }
        );

        return global.io.to(chat._id.toString()).emit('chat:sendMessage', {
          message: message,
          by: {
            _id: socket.user._id,
            username: socket.user.username,
          },
        });
        break;
      default:
        throw new Error(
          "Invalid message type, a message could be of type 'file' or 'text' only"
        );
    }
  } catch (error) {
    return cb({ success: false, error: error.message });
  }
}

export async function add_or_remove_admin(socket, data, cb, isAdd) {
  try {
    const { adminId } = data;
    const chatId = new mongoose.Types.ObjectId(data.chatId);

    const admin = await User.findById(adminId).select('_id');

    if (!admin) throw new Error('User not found');

    let chat = await GroupChat.aggregate([
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
          isMember: {
            $cond: {
              if: { $in: [admin._id, '$members'] },
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
      {
        $project: {
          _id: 1,
          isAdmin: 1,
          isCreator: 1,
        },
      },
    ]);

    chat = chat[0];

    if (!chat) throw new Error('Chat not found');
    if (!chat.isCreator) throw new Error('Not authorized');
    if (!chat.isMember) throw new Error('User is not a member');
    if (!chat.isAdmin && !isAdd) throw new Error('User is not an admin');
    if (chat.isAdmin && isAdd) throw new Error('User is already an admin');

    if (isAdd) {
      await GroupChat.updateOne(
        { _id: chat._id },
        { $push: { admins: admin._id } }
      );
    } else {
      await GroupChat.updateOne(
        { _id: chat._id },
        { $pull: { admins: admin._id } }
      );
    }

    cb({ success: true });

    return global.io
      .to(chat._id.toString())
      .emit(isAdd ? 'chat:addAdmin' : 'chat:removeAdmin', {
        admin: { _id: admin._id, username: admin.username },
      });
  } catch (error) {
    return cb({ success: false, error: error.message });
  }
}

export async function remove_member(socket, data, cb) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { memberId } = data;
    const chatId = new mongoose.Types.ObjectId(data.chatId);

    const member = await User.findById(memberId).select('_id');

    if (!member) throw new Error('User not found');
    if (socket.user.id === member._id)
      throw new Error('Cannot remove yourself');

    let chat = await GroupChat.aggregate([
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
          name: 1,
          creator: 1,
          isRequestorCreator: 1,
          isRequestorAdmin: 1,
          isOtherUserMember: 1,
          isOtherUserAdmin: 1,
        },
      },
    ]);

    chat = chat[0];

    if (!chat) throw new Error('Chat not found');

    if (member._id.toString() === chat.creator.toString())
      throw new Error('Cannot remove creator');

    if (!chat.isRequestorCreator && !chat.isRequestorAdmin)
      throw new Error('Not authorized');

    if (!chat.isOtherUserMember) throw new Error('User is not a member');

    if (chat.isRequestorAdmin && chat.isOtherUserAdmin)
      throw new Error('Not authorized');

    if (chat.isOtherUserAdmin) {
      await GroupChat.updateOne(
        { _id: chat._id },
        { $pull: { admins: member._id, members: member._id } }
      ).session(session);
    } else {
      await GroupChat.updateOne(
        { _id: chat._id },
        { $pull: { members: member._id } }
      ).session(session);
    }

    await User.updateOne(
      { _id: member._id },
      { $pull: { chats: chat._id } }
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    cb({ success: true });

    /* Disconnect the socket of the member from the chat._id */
    global.io.in(member.id).socketsLeave(chat._id.toString());
    /* Inform the removed user */
    global.io.to(member.id).emit('chat:removeMember', {
      chat: { _id: chat._id, name: chat.name },
    });

    return global.io.to(chat._id.toString()).emit('chat:removeMember', {
      member: { _id: member._id, username: member.username },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error: error.message });
  }
}

export async function leave_chat(socket, data, cb) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const chatId = new mongoose.Types.ObjectId(data.chatId);

    let chat = await GroupChat.aggregate([
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

    chat = chat[0];

    if (!chat) throw new Error('Chat not found');
    if (!chat.isMember) throw new Error('Already not a member');

    if (chat.isAdmin) {
      await GroupChat.updateOne(
        { _id: chat._id },
        {
          $pull: { members: socket.user._id, admins: socket.user._id },
        }
      ).session(session);
    } else {
      await GroupChat.updateOne(
        { _id: chat._id },
        {
          $pull: { members: socket.user._id },
        }
      ).session(session);
    }

    await User.updateOne(
      { _id: socket.user._id },
      { $pull: { chats: chat._id } }
    );

    await session.commitTransaction();
    session.endSession();

    cb({ success: true });

    /* Disconnect the socket of the member from the chat._id */
    socket.leave(chat._id.toString());

    return global.io.to(chat._id.toString()).emit('chat:leave', {
      member: { _id: socket.user._id, username: socket.user.username },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error: error.message });
  }
}

export async function change_name_or_photo(socket, data, cb, isName) {
  try {
    const { chatName, file } = data;
    const chatId = new mongoose.Types.ObjectId(data.chatId);

    let chat = await GroupChat.aggregate([
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

    chat = chat[0];

    if (!chat) throw new Error('Chat not found');
    if (!chat.isCreator) throw new Error('Not authorized');

    if (isName) {
      await GroupChat.updateOne(
        { _id: chat._id },
        { $set: { name: chatName } }
      );
      cb({ success: true });
      return global.io
        .to(chat._id.toString())
        .emit('chat:changeName', { name: chatName });
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

      writeStream.on('finish', async (err) => {
        if (err) return cb({ success: false, error: err.message });
        await GroupChat.updateOne(
          { _id: chat._id },
          { $set: { photo: fileName } }
        );

        cb({ success: true });

        return global.io.to(chat._id.toString()).emit('chat:changePhoto', {
          photo: fileName,
        });
      });

      writeStream.write(file);
      writeStream.end();
    }
  } catch (error) {
    return cb({ success: false, error: error.message });
  }
}
