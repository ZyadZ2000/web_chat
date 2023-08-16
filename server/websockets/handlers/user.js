import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../../models/user.js';
import Request from '../../models/request.js';
import { verify_credentials } from '../../utils/auth.js';

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
  const session = mongoose.startSession();
  session.startTransaction();
  try {
    const { email, password } = data;

    // Fetch user based on the provided email
    const user = await verify_credentials(email, password);

    // Check if user exists
    if (!user) {
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
