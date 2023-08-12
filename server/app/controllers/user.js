// Custom Modules
import User from '../../models/user.js';
import Chat from '../../models/chat.js';

export async function get_profile(req, res) {
  try {
    const user = await User.findById(req.userId).select(
      '_id email username profilePhoto bio chats friends'
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function get_user(req, res) {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username }).select(
      'username bio profilePhoto onlineStatus'
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function get_friends(req, res) {
  try {
    const friendIds = req.body.friendIds; // This one should be validated
    const friends = await User.find({ _id: { $in: friendIds } }).select(
      'username profilePhoto bio onlineStatus'
    );

    if (!friends) return res.status(404).json({ message: 'Users not found' });

    return res.status(200).json({ friends: friends });
  } catch (error) {
    next(error);
  }
}

export async function get_chats(req, res, next) {
  try {
    const chatIds = req.body.chatIds; // This one should be validated

    const user = await User.findById(req.userId).select('chats');

    const chats = await Chat.aggregate([
      { $match: { _id: { $in: user.chats } } },
      {
        $unwind: '$messages',
      },
      {
        $sort: { 'messages.createdAt': -1 },
      },
      {
        $group: { _id: '$_id', latestMessage: { $first: '$messages' } },
      },
      {
        $project: {
          _id: 1,
          latestMessage: 1,
          name: 1,
          type: 1,
          photo: 1,
          users: 1,
        },
      },
    ]);

    /*
    Two types of chats, private and group chats.
    for private chats I'd need to get the other user and fetch his profile photo and username
    for group chats I'd need to get the group chat name and photo

    for both chats I'd need to fetch the last message and the time it was sent
    */
  } catch (error) {
    next(error);
  }
}

export async function get_received_requests(req, res, next) {}

export async function get_sent_requests(req, res, next) {}

export async function get_starred_messages(req, res, next) {}

export async function search_users(req, res, next) {}
