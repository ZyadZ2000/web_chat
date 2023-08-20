// NPM Packages
import mongoose from 'mongoose';

// Custom Modules
import Request, {
  GroupChatRequest,
  JoinGroupRequest,
  PrivateRequest,
} from '../../models/request.js';
import User from '../../models/user.js';
import Chat, { GroupChat, PrivateChat } from '../../models/chat.js';

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
        result = await private_and_friend_request(
          socket.user,
          request,
          session,
          isAccept
        );
        break;
      case 'groupRequest':
        result = await group_request(socket.user, request, session, isAccept);
        break;
      case 'joinRequest':
        result = await join_request(socket.user, request, session, isAccept);
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

    if (result.to) {
      return global.io.to(result.to).emit(result.event, {
        ...result.eventData,
      });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error: error.message });
  }
}

export async function send_private_or_friend_request(
  socket,
  data,
  cb,
  isPrivate
) {
  try {
    const receiverId = new mongoose.Types.ObjectId(data.receiverId);

    let receiver = await User.aggregate([
      {
        $match: { _id: receiverId },
      },
      {
        $addFields: {
          isAlreadyFriend: {
            $cond: {
              if: { $in: [socket.user._id, '$friends'] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          isAlreadyFriend: 1,
        },
      },
    ]);

    receiver = receiver[0];

    if (!receiver) throw new Error('Receiver not found');

    if (isPrivate) {
      const chat = await PrivateChat.findOne({
        users: { $all: [socket.user._id, receiver._id] },
      }).select('_id');

      if (chat)
        throw new Error('A private chat with the receiver already exists');
    } else {
      if (receiver.isAlreadyFriend) throw new Error('You are already friends');
    }

    const request = new Request({
      type: isPrivate ? 'privateRequest' : 'friendRequest',
      sender: socket.user._id,
      receiver: receiver._id,
    });

    await request.save();

    cb({ success: true });

    return global.io.to(receiver._id.toString()).emit('request:receive', {
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
    return cb({ success: false, error: error.message });
  }
}

export async function send_group_or_join_request(socket, data, cb, isGroupReq) {
  try {
    let receiverId;
    let receiver;

    const chatId = new mongoose.Types.ObjectId(data.chatId);

    if (isGroupReq) {
      receiverId = data.receiverId;

      receiver = await User.findById(receiverId).select('_id');

      if (!receiver) throw new Error('Receiver not found');
    }
    let chat = await GroupChat.aggregate([
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

    chat = chat[0];

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
      .to(isGroupReq ? receiver.id : chat._id.toString())
      .emit('request:receive', {
        type: request.type,
        requestId: request.id,
        chat: isGroupReq ? chat : null,
        by: isGroupReq
          ? null
          : {
              _id: socket.user.id,
              username: socket.user.username,
              bio: socket.user.bio,
              profilePhoto: socket.user.profilePhoto,
              onlineStatus: socket.user.onlineStatus,
            },
      });
  } catch (error) {
    return cb({ success: false, error: error.message });
  }
}

async function private_and_friend_request(user, request, session, isAccept) {
  if (request.receiver.toString() !== user.id)
    throw new Error('Not authorized');

  let result = { cbData: {}, eventData: { type: request.type } };

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

      await chat.save({ session });

      await User.updateOne(
        { _id: user._id },
        { $push: { chats: chat._id } }
      ).session(session);

      await User.updateOne(
        { _id: sender._id },
        { $push: { chats: chat._id } }
      ).session(session);

      result.cbData.chat = chat;
      result.eventData.chat = chat;
    } else if (request.type === 'friendRequest') {
      await User.updateOne(
        { _id: user._id },
        { $push: { friends: sender._id } }
      ).session(session);
      await User.updateOne(
        { _id: sender._id },
        { $push: { friends: user._id } }
      ).session(session);
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

  await Request.deleteOne({ _id: request._id }).session(session);

  return result;
}

async function group_request(user, request, session, isAccept) {
  if (request.receiver.toString() !== user.id)
    throw new Error('Not authorized');

  const chat = await GroupChat.findById(request.chat).select(
    '_id name photo description creator createdAt'
  );

  if (!chat) throw new Error('Chat not found');

  let result = { cbData: {}, eventData: {} };

  if (isAccept) {
    result.to = chat._id.toString();
    result.event = 'chat:join';

    await User.updateOne(
      { _id: user._id },
      { $push: { chats: chat._id } }
    ).session(session);
    await GroupChat.updateOne(
      { _id: chat._id },
      { $push: { members: user._id } }
    ).session(session);

    result.cbData.type = request.type;
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

  await Request.deleteOne({ _id: request._id }).session(session);

  return result;
}

async function join_request(user, request, session, isAccept) {
  let chat = await Chat.aggregate([
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

  chat = chat[0];

  if (!chat) throw new Error('Chat not found');

  if (!chat.isAuthorized) throw new Error('Not authorized');

  const sender = await User.findById(request.sender).select(
    '_id username bio profilePhoto onlineStatus createdAt'
  );

  let result = {
    cbData: {},
    eventData: {},
    dataToRequestSender: {},
  };

  result.requestSender = sender;
  result.dataToRequestSender.type = 'joinRequest';

  if (isAccept) {
    result.to = chat._id.toString();

    result.event = 'chat:join';

    await User.updateOne(
      { _id: sender._id },
      { $push: { chats: chat._id } }
    ).session(session);

    await GroupChat.updateOne(
      { _id: chat._id },
      { $push: { members: sender._id } }
    ).session(session);

    result.dataToRequestSender.chat = chat;
    result.eventData.user = sender;
  } else {
    result.dataToRequestSender.chat = chat._id;
  }
  await Request.deleteOne({ _id: request._id }).session(session);

  return result;
}
