// NPM Packages
import mongoose from 'mongoose';

// Custom Modules
import User from '../../models/user.js';
import Request from '../../models/request.js';
import { verify_credentials } from '../../utils/auth.js';

export async function remove_friend(socket, data, cb) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const friendId = new mongoose.Types.ObjectId(data.friendId);

    let friend = await User.aggregate([
      {
        $match: { _id: friendId },
      },
      {
        $addFields: {
          isFriend: {
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
          username: 1,
          bio: 1,
          profilePhoto: 1,
          onlineStatus: 1,
          createdAt: 1,
          isFriend: 1,
        },
      },
    ]);

    friend = friend[0];

    if (!friend) throw new Error('User not found');
    if (!friend.isFriend) throw new Error('User is not your friend');

    // Remove friend from both users' friends arrays
    await User.updateOne(
      { _id: socket.user._id },
      { $pull: { friends: friend._id } }
    ).session(session);
    await User.updateOne(
      { _id: friend._id },
      { $pull: { friends: socket.user._id } }
    ).session(session);

    // Commit the transaction and end the session
    await session.commitTransaction();
    session.endSession();

    // Respond to the client indicating success
    cb({ success: true });

    // Emit an event to the removed friend notifying about the removal
    return global.io.to(friend._id.toString()).emit('user:removeFriend', {
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
    // Handle errors by aborting the transaction and ending the session
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error: error.message });
  }
}

export async function delete_user(socket, data, cb) {
  const session = await mongoose.startSession();
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

    await User.deleteOne({ _id: socket.user._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    cb({ success: true });

    global.io.emit('user:delete', {
      _id: socket.user.id,
      username: socket.user.username,
    });

    return socket.disconnect();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return cb({ success: false, error: error.message });
  }
}
