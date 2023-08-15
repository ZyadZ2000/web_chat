import mongoose from 'mongoose';
import User from '../../models/user.js';

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
