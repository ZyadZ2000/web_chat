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
import Request from '../../models/request.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function join_chat(socket, data, cb) {
  try {
    let error;
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

    if (!chat) {
      error = new Error('Chat not found');
      error.code = 404;
      throw error;
    }
    if (!chat.isMember) {
      error = new Error('Not authorized found');
      error.code = 402;
      throw error;
    }

    socket.join(chat._id.toString());

    return cb({ success: true });
  } catch (error) {
    return cb({
      success: false,
      code: error.code || 500,
      error: error.message,
    });
  }
}

export async function send_message(socket, data, cb) {
  try {
    let error;
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

    if (!chat) {
      error = new Error('Chat not found');
      error.code = 404;
      throw error;
    }

    if (!chat.isMember) {
      error = new Error('Not authorized found');
      error.code = 402;
      throw error;
    }

    switch (messageType) {
      case 'file':
        if (!file) {
          error = new Error('No file provided');
          error.code = 400;
          throw error;
        }

        //check its type by calling get_valid_file_type();
        const detectedFileType = await fileTypeFromBuffer(file);

        if (
          detectedFileType.ext !== 'png' &&
          detectedFileType.ext !== 'jpg' &&
          detectedFileType.ext !== 'mp4' &&
          detectedFileType.ext !== 'mp3'
        ) {
          error = new Error('Invalid file type');
          error.code = 400;
          throw error;
        }
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
          if (err) return cb({ success: false, code: 500, error: err.message });
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
        if (!messageContent) {
          error = new Error('No message provided');
          error.code = 400;
          throw error;
        }
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
      default: {
        error = new Error(
          'Ivalid message type, a message could be text or file'
        );
        error.code = 400;
        throw error;
      }
    }
  } catch (error) {
    return cb({
      success: false,
      code: error.code || 500,
      error: error.message,
    });
  }
}

export async function add_or_remove_admin(socket, data, cb, isAdd) {
  try {
    let error;
    const { adminId } = data;
    const chatId = new mongoose.Types.ObjectId(data.chatId);

    const admin = await User.findById(adminId).select('_id');

    if (!admin) {
      error = new Error('User not found');
      error.code = 404;
      throw error;
    }

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

    if (!chat) {
      error = new Error('Chat not found');
      error.code = 404;
      throw error;
    }
    if (!chat.isCreator) {
      error = new Error('Not authorized');
      error.code = 402;
      throw error;
    }
    if (!chat.isMember) {
      error = new Error('User is not a member');
      error.code = 400;
      throw error;
    }
    if (!chat.isAdmin && !isAdd) {
      error = new Error('User is not an admin');
      error.code = 400;
      throw error;
    }
    if (chat.isAdmin && isAdd) {
      error = new Error('User is already an admin');
      error.code = 400;
      throw error;
    }

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
    return cb({
      success: false,
      code: error.code || 500,
      error: error.message,
    });
  }
}

export async function remove_member(socket, data, cb) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let error;
    const { memberId } = data;
    const chatId = new mongoose.Types.ObjectId(data.chatId);

    const member = await User.findById(memberId).select('_id');

    if (!member) {
      error = new Error('User not found');
      error.code = 404;
      throw error;
    }
    if (socket.user.id === member._id) {
      error = new Error('Cannot remove yourself');
      error.code = 400;
      throw error;
    }

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

    if (!chat) {
      error = new Error('Chat not found');
      error.code = 404;
      throw error;
    }

    if (member._id.toString() === chat.creator.toString()) {
      error = new Error('Cannot remove the creator');
      error.code = 400;
      throw error;
    }

    if (!chat.isRequestorCreator && !chat.isRequestorAdmin) {
      error = new Error('Not authorized');
      error.code = 402;
      throw error;
    }

    if (!chat.isOtherUserMember) {
      error = new Error('User is not a member');
      error.code = 400;
      throw error;
    }

    if (chat.isRequestorAdmin && chat.isOtherUserAdmin) {
      error = new Error('Cannot remove an admin');
      error.code = 400;
      throw error;
    }

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
    return cb({
      success: false,
      code: error.code || 500,
      error: error.message,
    });
  }
}

export async function leave_chat(socket, data, cb) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let error;
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

    if (!chat) {
      error = new Error('Chat not found');
      error.code = 404;
      throw error;
    }
    if (!chat.isMember) {
      error = new Error('Not authorized');
      error.code = 402;
      throw error;
    }

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
    return cb({
      success: false,
      code: error.code || 500,
      error: error.message,
    });
  }
}

export async function delete_chat(socket, data, cb) {
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

    if (!chat) {
      error = new Error('Chat not found');
      error.code = 404;
      throw error;
    }

    if (!chat.isCreator) {
      error = new Error('Not authorized');
      error.code = 402;
      throw error;
    }

    await User.updateMany(
      { chats: chat._id },
      { $pull: { chats: chat._id } }
    ).session(session);

    await Request.deleteMany(
      { chat: chat._id },
      { $pull: { chats: chat._id } }
    ).session(session);

    await GroupChat.deleteOne({ _id: chat._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    cb({ success: true });

    global.io.to(chat._id.toString()).emit('chat:delete', {
      chat: { _id: chat._id },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({
      success: false,
      code: error.code || 500,
      error: error.message,
    });
  }
}

export async function change_name_or_photo_or_description(
  socket,
  data,
  cb,
  nameOrPhotoOrDescription
) {
  try {
    let error;
    const { chatName, chatDescription, file } = data;
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

    if (!chat) {
      error = new Error('Chat not found');
      error.code = 404;
      throw error;
    }
    if (!chat.isCreator) {
      error = new Error('Not authorized');
      error.code = 402;
      throw error;
    }

    if (nameOrPhotoOrDescription === 1) {
      if (!chatName) {
        error = new Error('No chat name provided');
        error.code = 400;
        throw error;
      }
      await GroupChat.updateOne(
        { _id: chat._id },
        { $set: { name: chatName } }
      );
      cb({ success: true });
      return global.io
        .to(chat._id.toString())
        .emit('chat:changeName', { name: chatName });
    } else if (nameOrPhotoOrDescription === 2) {
      if (!file) {
        error = new Error('No file provided');
        error.code = 400;
        throw error;
      }

      const fileType = await fileTypeFromBuffer(file);
      if (fileType.ext !== 'png' && fileType.ext !== 'jpg') {
        error = new Error('Invalid file type');
        error.code = 400;
        throw error;
      }

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
        if (err) return cb({ success: false, code: 500, error: err.message });
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
    } else if (nameOrPhotoOrDescription === 3) {
      if (!chatDescription) {
        error = new Error('No chat description provided');
        error.code = 400;
        throw error;
      }
      await GroupChat.updateOne(
        { _id: chat._id },
        { $set: { description: chatDescription } }
      );
      cb({ success: true });
      return global.io
        .to(chat._id.toString())
        .emit('chat:changeDescription', { description: chatDescription });
    }
  } catch (error) {
    return cb({
      success: false,
      code: error.code || 500,
      error: error.message,
    });
  }
}
