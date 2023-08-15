import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../../models/user.js';
import Request from '../../models/request.js';

export async function remove_friend(socket, data, cb) {
  let friend;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { friendId } = data;

    // Find the friend by ID and select relevant fields
    friend = await User.findById(friendId).select('_id username friends');

    if (!friend) return cb({ success: false, error: 'Friend not found' });

    // Remove friend from both users' friends arrays
    socket.user.friends = socket.user.friends.filter((f) => f !== friend._id);
    friend.friends = friend.friends.filter((f) => f !== socket.user._id);

    // Save both users' updated data using the session
    await socket.user.save().session(session);
    await friend.save().session(session);

    // Commit the transaction and end the session
    await session.commitTransaction();
    session.endSession();

    // Respond to the client indicating success
    cb({ success: true });

    // Emit an event to the removed friend notifying about the removal
    return global.io.to(friend._id).emit('user:removeFriend', {
      by: {
        _id: socket.user._id,
        username: socket.user.username,
      },
      removed: {
        _id: friend._id,
        username: friend.username,
      },
    });
  } catch (error) {
    // Handle errors by aborting the transaction and ending the session
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error });
  }
}

export async function delete_user(socket, data, cb) {
  /*
  Implications of deleting a user: everything that references this user must be modified.
  and using arrays is even worse for performance, but today isn't the time for that.

  so we have different data entites that get affected:
  users who have this user as a friend
  chats who have this user as either a creator, a member or an admin
  requests sent and received by this user
  private chat who have this user.

  one at a time:
  for private chats, I can't delete the chat for the other user, but I certainly can say that the user is no longer a
  member, and give him a dummy username, and a default avatar.

  for group chat, if the user is the creator, it will be given to the first admin, so he can delete the chat if he wants.
 (I will write that logic inside the chat handlers)
  for requests, I can delete the requests sent by this user, and delete the requests received by this user.

  for friends, I will just delete the user _id from the array.
 */
  const session = mongoose.startSession();
  session.startTransaction();
  try {
    const { email, password } = data;

    // Fetch user based on the provided email
    const user = await User.findOne({ email: email });

    // Check if user exists
    if (!user) {
      return cb({ success: false, error: 'User not found' });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return cb({ success: false, error: 'User not found' });
    }

    await User.updateMany(
      { friends: socket.user._id },
      { $pull: { friends: socket.user._id } }
    ).session(session);

    await Request.deleteMany({
      $or: [{ sender: socket.user._id }, { receiver: socket.user._id }],
    }).session(session);

    await socket.user.remove().session(session);

    await session.commitTransaction();
    session.endSession();

    cb({ success: true });

    return socket.disconnect();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error });
  }
}
