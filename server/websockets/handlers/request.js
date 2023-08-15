import mongoose from 'mongoose';
import Request from '../../models/request.js';
import User from '../../models/user.js';
import { PrivateChat } from '../../models/chat.js';

/*
 I have 4 types of requests, let's talk about accepting each one first:

 - privateRequest: upon acceptance, I chat room will be created and its info (_id), along with the other
    user info will be sent. (the chat room will be added to each user document)
 - friendRequest: the same, but without the chat room.
 - groupRequest: the user must be added to the group, and the chat id will be added to the user, and the group
    info will also be sent to the user, the chat room would be informed by this.
 - joinRequest: this could only be accepted and viewed by admins, the user will be added to the group, and the chat
    room will be informed.

 When it comes to declining, I guess the perfect case would be telling the chat admins and creator that the request
 was declined, and in terms of private requests, informing the other user is important
*/

/*
 A little problem has emerged actually, you know that I add data, when I add data, I want to make sure that data
 is actually not redundant, like two users can't have two private chats, they can't add themselved twice, you see
 what I mean ? I might handle this in the request sending since I already handle this on the server, I will make sure
 that it doesn't allow redundancy, that's a little better.

*/
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
        break;
      case 'joinRequest':
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
  } catch (error) {
    return cb({ success: false, error });
  }
}

async function accept_private_request(user, request, session, cb) {
  if (request.receiver !== user._id)
    return cb({
      success: false,
      error: 'Not authorized to accept the request',
    });
  const sender = await User.findById(request.sender).select(
    '_id username bio profilePhoto onlineStatus'
  );
  const chat = new PrivateChat({
    type: 'privateChat',
    users: [user._id, sender._id],
  });

  user.chats.push(chat._id);
  sender.chats.push(chat._id);

  await chat.save().session(session);
  await request.deleteOne().session(session);
  await user.save().session(session);
  await sender.save().session(session);

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
