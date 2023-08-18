// NPM Packages
import mongoose from 'mongoose';

// Custom Modules
import User from '../../models/user.js';
import Request from '../../models/request.js';
import { verify_credentials } from '../../utils/auth.js';

export async function remove_friend(socket, data, cb) {
  let friend;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const friendId = new mongoose.Types.ObjectId(data);

    // Find the friend by ID and select relevant fields
    friend = await User.findOne({
      _id: friendId,
      friends: socket.user._id /* Check if both users are friends */,
    }).select('_id username bio profilePhoto onlineStatus createdAt');

    if (!friend) throw new Error('Friend not found');

    // Remove friend from both users' friends arrays
    await socket.user
      .updateOne({ $pull: { friends: friend._id } })
      .session(session);
    await friend
      .updateOne({ $pull: { friends: socket.user._id } })
      .session(session);

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
        bio: socket.user.bio,
        profilePhoto: socket.user.profilePhoto,
        onlineStatus: socket.user.onlineStatus,
        createdAt: socket.user.createdAt,
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
    if (!user) throw new Error('Not authenticated');

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

    global.io.emit('user:delete', {
      _id: socket.user._id,
    });

    return socket.disconnect();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error });
  }
}
