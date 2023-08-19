// NPM Packages
import mongoose from 'mongoose';

// Custom Modules
import Request, {
  GroupChatRequest,
  JoinGroupRequest,
  PrivateRequest,
} from '../../models/request.js';
import User from '../../models/user.js';
import { GroupChat, PrivateChat } from '../../models/chat.js';

export async function accept_or_decline_request(socket, data, cb, isAccept) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { requestId } = data;

    const request = await Request.findById(requestId);

    if (!request) throw new Error('Request not found');

    let result;
    switch (request.type) {
      case 'privateRequest':
      case 'friendRequest':
        result = private_and_friend_request(
          socket.user,
          request,
          session,
          isAccept
        );
        break;
      case 'groupRequest':
        result = group_request(socket.user, request, session, isAccept);
        break;
      case 'joinRequest':
        result = join_request(socket.user, request, session, isAccept);
        break;
      default:
        throw new Error('Invalid request type');
    }

    await session.commitTransaction();
    session.endSession();

    cb({ success: true, ...result.cbData });

    if (request.type === 'joinRequest') {
      global.io
        .to(result.requestSender.id)
        .emit(isAccept ? 'request:accept' : 'result:decline', {
          ...result.dataToRequestSender,
        });
    }

    if (request.to)
      return global.io.to(result.to).emit(result.event, {
        ...result.eventData,
      });
  } catch (error) {
    session.abortTransaction();
    session.endSession();
    return cb({ success: false, error });
  }
}

export async function send_private_or_friend_request(
  socket,
  data,
  cb,
  isPrivate
) {
  try {
    const { receiverId } = data;
    const receiver = await User.findById(receiverId).select('_id');
    if (!receiver) throw new Error('Receiver not found');

    if (isPrivate) {
      const chat = await PrivateChat.findOne({
        users: { $all: [socket.user._id, receiver._id] },
      }).select('_id');

      if (chat)
        throw new Error('A private chat with the receiver already exists');
    } else {
      const isFriend = socket.user.friends.includes(receiver._id);
      if (isFriend) throw new Error('You are already friends');
    }

    let request;
    request = new Request({
      type: isPrivate ? 'privateRequest' : 'friendRequest',
      sender: socket.user._id,
      receiver: receiver._id,
    });

    await request.save();

    cb({ success: true });

    return global.io.to(receiver.id).emit('request:receive', {
      type: request.type,
      requestId: request.id,
      by: {
        _id: socket.user.id,
        username: socket.user.username,
        bio: socket.user.bio,
        profilePhoto: socket.user.profilePhoto,
        onlineStatus: socket.user.onlineStatus,
        createdAt: socket.user.createdAt,
      },
    });
  } catch (error) {
    return cb({ success: false, error });
  }
}

export async function send_group_or_join_request(socket, data, cb, isGroupReq) {
  try {
    let receiverId;
    let receiver;

    const chatId = data.chatId;

    if (isGroupReq) {
      receiverId = data.receiverId;

      receiver = await User.findById(receiverId).select('_id');

      if (!receiver) throw new Error('Receiver not found');
    }
    const chat = await GroupChat.aggregate([
      {
        $match: { _id: chatId },
      },
      isGroupReq
        ? {
            $addFields: {
              isAuthorized: {
                $cond: {
                  if: {
                    $or: [
                      { $in: [socket.user._id, '$admins'] },
                      { $eq: [socket.user._id, '$creator'] },
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
              isAlreadyMember: {
                $cond: {
                  if: {
                    $in: [receiver._id, '$members'],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          }
        : {
            $addFields: {
              isAlreadyMember: {
                $cond: {
                  if: {
                    $in: [socket.user._id, '$members'],
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
          name: 1,
          photo: 1,
          description: 1,
          creator: 1,
          createdAt: 1,
          isAuthorized: 1,
          isAlreadyMember: 1,
        },
      },
    ]);

    if (!chat) throw new Error('Chat not found');

    if (isGroupReq && !chat.isAuthorized) throw new Error('Not authorized');

    if (chat.isAlreadyMember) throw new Error('User is already a member');

    const request = isGroupReq
      ? new GroupChatRequest({
          chat: chat._id,
          receiver: receiver._id,
        })
      : new JoinGroupRequest({
          sender: socket.user._id,
          chat: chat._id,
        });

    await request.save();

    cb({ success: true });

    return global.io
      .to(isGroupReq ? receiver.id : chat.id)
      .emit('request:receive', {
        type: request.type,
        requestId: request.id,
        chat: isGroupReq ? chat : null,
        sender: isGroupReq
          ? {
              _id: socket.user.id,
              username: socket.user.username,
              bio: socket.user.bio,
              profilePhoto: socket.user.profilePhoto,
              onlineStatus: socket.user.onlineStatus,
            }
          : null,
      });
  } catch (error) {
    return cb({ success: false, error });
  }
}

async function private_and_friend_request(user, request, session, isAccept) {
  if (request.receiver !== user._id) throw new Error('Not authorized');

  let result = { type: request.type, cbData: {}, eventData: {} };

  const sender = await User.findById(request.sender).select(
    '_id username bio profilePhoto onlineStatus createdAt'
  );

  if (!sender) throw new Error('Sender not found');

  result.to = sender.id;

  let chat;
  if (isAccept) {
    result.event = 'request:accept';
    result.cbData.user = sender;
    if (request.type === 'privateRequest') {
      chat = new PrivateChat({
        type: 'privateChat',
        users: [user._id, sender._id],
      });

      user.chats.push(chat._id);
      sender.chats.push(chat._id);

      await chat.save().session(session);
      await user.save().session(session);
      await sender.save().session(session);

      result.cbData.chat = chat;
      result.eventData.chat = chat;
    } else if (request.type === 'friendRequest') {
      user.friends.push(sender._id);
      sender.friends.push(user._id);

      await user.save().session(session);
      await sender.save().session(session);
    }
  } else {
    result.event = 'request:decline';
  }

  result.eventData.by = {
    _id: user.id,
    username: user.username,
    bio: user.bio,
    profilePhoto: user.profilePhoto,
    onlineStatus: user.onlineStatus,
    createdAt: user.createdAt,
  };

  await request.deleteOne().session(session);

  return result;
}

/**
 * In both those functions, don't forget to join the user to the chat room.
 */
async function group_request(user, request, session, isAccept) {
  if (request.receiver !== user._id) throw new Error('Not authorized');

  const chat = await GroupChat.findById(request.chat).select(
    'name photo description creator createdAt'
  );

  if (!chat) throw new Error('Chat not found');

  let result = { type: request.type, cbData: {}, eventData: {} };

  if (isAccept) {
    result.to = chat.id;
    result.event = 'chat:join';
    user.chats.push(chat._id);
    chat.members.push(user._id);

    await user.save().session(session);
    await chat.save().session(session);

    result.cbData.chat = chat;
    result.eventData.user = {
      _id: user.id,
      username: user.username,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      onlineStatus: user.onlineStatus,
      createdAt: user.createdAt,
    };
  }

  await request.deleteOne().session(session);

  return result;
}

async function join_request(user, request, session, isAccept) {
  const chat = await GroupChat.aggregate([
    {
      $match: { _id: request.chat },
    },
    {
      $addFields: {
        isAuthorized: {
          $cond: {
            if: {
              $or: [
                { $in: [user._id, '$admins'] },
                { $eq: [user._id, '$creator'] },
              ],
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
        name: 1,
        photo: 1,
        description: 1,
        creator: 1,
        createdAt: 1,
        isAuthorized: 1,
      },
    },
  ]);

  if (!chat) throw new Error('Chat not found');

  if (!chat.isAuthorized) throw new Error('Not authorized');

  const sender = await User.findById(request.sender).select(
    '_id username bio profilePhoto onlineStatus createdAt'
  );

  let result = {
    type: request.type,
    cbData: {},
    eventData: {},
    dataToRequestSender: {},
  };
  result.requestSender = sender;

  if (isAccept) {
    result.to = chat.id;
    result.event = 'chat:join';
    acceptedUser.chats.push(chat._id);
    chat.members.push(sender._id);

    await acceptedUser.save().session(session);
    await chat.save().session(session);

    result.dataToRequestSender.chat = chat;
    result.eventData.user = sender;
  }
  await request.deleteOne().session(session);

  return result;
}
