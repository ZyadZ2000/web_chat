import mongoose from 'mongoose';
import Request from '../../models/request.js';
import User from '../../models/user.js';
import { GroupChat, PrivateChat } from '../../models/chat.js';

export async function accept_request(socket, data, cb) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { requestId } = data;

    const request = await Request.findById(requestId);

    if (!request) return cb({ success: false, error: 'Request not found' });

    switch (request.type) {
      case 'privateRequest':
        return accept_private_chat_request(socket.user, request, session, cb);
        break;
      case 'friendRequest':
        return accept_friend_request(socket.user, request, session, cb);
        break;
      case 'groupRequest':
        return accept_group_request(socket.user, request, session, cb);
        break;
      case 'joinRequest':
        return accept_join_request(socket.user, request, session, cb);
        break;
      default:
        return cb({ success: false, error: 'Invalid request type' });
    }
  } catch (error) {
    session.abortTransaction();
    session.endSession();
    return cb({ success: false, error });
  }
}

export async function decline_request(socket, data, cb) {
  try {
    const { requestId } = data;

    const request = await Request.findById(requestId);

    if (!request) return cb({ success: false, error: 'Request not found' });

    let sender;
    switch (request.type) {
      case 'privateRequest':
      case 'friendRequest':
        if (request.receiver !== socket.user._id)
          return cb({
            success: false,
            error: 'Not authorized to decline the request',
          });

        sender = await User.findById(request.sender).select('_id');

        await request.deleteOne();
        cb({ success: true });

        return global.io.to(sender._id).emit('request:decline', {
          type: request.type,
          by: {
            _id: socket.user._id,
            username: socket.user.username,
            bio: socket.user.bio,
            profilePhoto: socket.user.profilePhoto,
            onlineStatus: socket.user.onlineStatus,
          },
        });
        break;
      case 'groupRequest':
        if (request.receiver !== socket.user._id)
          return cb({
            success: false,
            error: 'Not authorized to decline the request',
          });

        await request.deleteOne();

        return cb({ success: true });
        break;
      case 'joinRequest':
        const chat = await GroupChat.findOne({
          _id: request.chat,
          $or: [{ admin: socket.user._id }, { creator: socket.user._id }],
        }).select('_id name');

        if (!chat)
          return cb({
            success: false,
            error: 'Not authorized to decline the request',
          });

        sender = await User.findById(request.sender).select('_id');

        await request.deleteOne();

        cb({ success: true });

        return global.io.to(chat._id).emit('request:decline', {
          type: 'joinRequest',
          chat: {
            _id: chat._id,
            name: chat.name,
          },
        });
        break;
      default:
        return cb({ success: false, error: 'Invalid request type' });
    }
  } catch (error) {
    return cb({ success: false, error });
  }
}

async function handle_private_chat_request(
  user,
  request,
  session,
  acceptDecline
) {
  if (request.receiver !== user._id) return false;
  const sender = await User.findById(request.sender).select(
    '_id username bio profilePhoto onlineStatus'
  );
  let chat;
  if (acceptDecline === 'accept') {
    chat = new PrivateChat({
      type: 'privateChat',
      users: [user._id, sender._id],
    });

    user.chats.push(chat._id);
    sender.chats.push(chat._id);

    await chat.save().session(session);
    await user.save().session(session);
    await sender.save().session(session);
  }

  await request.deleteOne().session(session);

  cb({ success: true, chat, sender });

  return global.io.to(sender._id).emit('request:accept', {
    type: 'privateChatRequest',
    chat,
    by: {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      onlineStatus: user.onlineStatus,
    },
  });
}

async function accept_friend_request(user, request, session, cb) {
  if (request.receiver !== user._id)
    return cb({
      success: false,
      error: 'Not authorized to accept the request',
    });
  const sender = await User.findById(request.sender).select(
    '_id username bio profilePhoto onlineStatus'
  );

  user.friends.push(sender._id);
  sender.friends.push(user._id);

  await user.save().session(session);
  await sender.save().session(session);
  await request.deleteOne().session(session);

  cb({ success: true, sender });

  return global.io.to(sender._id).emit('request:accept', {
    type: 'friendRequest',
    by: {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      onlineStatus: user.onlineStatus,
    },
  });
}

async function accept_group_request(user, request, session, cb) {
  if (request.receiver !== user._id)
    return cb({
      success: false,
      error: 'Not authorized to accept the request',
    });

  const chat = await GroupChat.findById(request.chat).select(
    'name photo description creator createdAt'
  );

  user.chats.push(chat._id);
  chat.members.push(user._id);

  await user.save().session(session);
  await chat.save().session(session);
  await request.deleteOne().session(session);

  cb({ success: true, chat });

  return global.io.to(chat._id).emit('chat:join', {
    user: {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      onlineStatus: user.onlineStatus,
    },
  });
}

async function accept_join_request(user, request, session, cb) {
  const chat = await GroupChat.findOne({
    _id: request.chat,
    $or: [{ admin: user._id }, { creator: user._id }],
  }).select('name photo description creator createdAt');

  if (!chat)
    return cb({ success: false, error: 'Not authorized to accept request' });

  const acceptedUser = await User.findById(request.receiver).select(
    '_id username bio profilePhoto onlineStatus'
  );

  acceptedUser.chats.push(chat._id);
  chat.members.push(acceptedUser._id);

  await acceptedUser.save().session(session);
  await chat.save().session(session);
  await request.deleteOne().session(session);

  cb({ success: true, user: acceptedUser });

  return global.io.to(chat._id).emit('chat:join', {
    user: acceptedUser,
  });
}
