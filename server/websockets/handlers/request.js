import mongoose from 'mongoose';
import Request, { PrivateRequest } from '../../models/request.js';
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

    if (request.type === 'joinRequest') {
      cb({ success: true });
      global.io
        .to(result.sender._id)
        .emit(isAccept ? 'request:accept' : 'result:decline', {
          ...result.dataToSender,
        });
    } else {
      cb({ success: true, ...result.cbData });
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

    return global.io.to(receiver._id).emit('request:receive', {
      type: request.type,
      requestId: request._id,
      by: {
        _id: socket.user._id,
        username: socket.user.username,
        bio: socket.user.bio,
        profilePhoto: socket.user.profilePhoto,
        onlineStatus: socket.user.onlineStatus,
      },
    });
  } catch (error) {
    return cb({ success: false, error });
  }
}

async function private_and_friend_request(user, request, session, isAccept) {
  if (request.receiver !== user._id) throw new Error('Not authorized');

  let result = { type: request.type, cbData: {}, eventData: {} };

  const sender = await User.findById(request.sender).select(
    '_id username bio profilePhoto onlineStatus'
  );

  if (!sender) throw new Error('Sender not found');

  result.to = sender._id;

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
    result.event = 'request.decline';
  }

  result.eventData.by = {
    _id: user._id,
    username: user.username,
    bio: user.bio,
    profilePhoto: user.profilePhoto,
    onlineStatus: user.onlineStatus,
  };

  await request.deleteOne().session(session);

  return result;
}

async function group_request(user, request, session, isAccept) {
  if (request.receiver !== user._id) throw new Error('Not authorized');

  const chat = await GroupChat.findById(request.chat).select(
    'name photo description creator createdAt'
  );

  if (!chat) throw new Error('Chat not found');

  let result = { type: request.type, cbData: {}, eventData: {} };

  if (isAccept) {
    result.event = 'chat:join';
    user.chats.push(chat._id);
    chat.members.push(user._id);

    await user.save().session(session);
    await chat.save().session(session);

    result.cbData.chat = chat;
    result.eventData.user = {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      onlineStatus: user.onlineStatus,
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

  const sender = await User.findById(request.receiver).select(
    '_id username bio profilePhoto onlineStatus'
  );

  let result = {
    type: request.type,
    cbData: {},
    eventData: {},
    dataToSender: {},
  };
  result.sender = sender;

  if (isAccept) {
    result.to = chat._id;
    result.event = 'chat:join';
    acceptedUser.chats.push(chat._id);
    chat.members.push(sender._id);

    await acceptedUser.save().session(session);
    await chat.save().session(session);

    result.dataToSender.chat = chat;
    result.eventData.user = sender;
  }
  await request.deleteOne().session(session);

  return result;
}
