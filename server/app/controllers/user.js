// Custom Modules
import User from '../../models/user.js';
import Chat from '../../models/chat.js';
import Request from '../../models/request.js';

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
    const friendIds = req.body.friendIds;
    const friends = await User.find({ _id: { $in: friendIds } }).select(
      'username profilePhoto bio onlineStatus'
    );

    if (!friends) return res.status(404).json({ message: 'Users not found' });

    return res.status(200).json({ friends: friends });
  } catch (error) {
    return next(error);
  }
}

export async function get_chats(req, res, next) {
  try {
    const chatIds = req.body.chatIds;

    const chats = await Chat.aggregate([
      { $match: { _id: { $in: chatIds } } },
      {
        $lookup: {
          from: 'users',
          localField: 'users',
          foreignField: '_id',
          as: 'users',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          photo: 1,
          type: 1,
          'users._id': 1,
          'users.username': 1,
          'users.profilePhoto': 1,
          'chat.messages': { $slice: ['$chat.messages', -1] },
        },
      },
    ]);

    if (!chats) return res.status(404).json({ message: 'Chats not found' });

    return res.status(200).json({ chats: chats });
  } catch (error) {
    return next(error);
  }
}

export async function get_received_requests(req, res, next) {
  try {
    const receivedReqs = await Request.find({ receiverId: req.userId })
      .populate('senderId', '_id username profilePhoto onlineStatus bio')
      .populate('chatId', '_id name photo description');

    if (!receivedReqs)
      return res.status(404).json({ message: 'No received requests' });

    return res.status(200).json({ receivedReqs });
  } catch (error) {
    return next(error);
  }
}

export async function get_sent_requests(req, res, next) {
  try {
    const sentReqs = await Request.find({ senderId: req.userId })
      .populate('receiverId', '_id username profilePhoto onlineStatus bio')
      .populate('chatId', '_id name photo description');

    if (!receivedReqs)
      return res.status(404).json({ message: 'No received requests' });

    return res.status(200).json({ receivedReqs });
  } catch (error) {
    return next(error);
  }
}

export async function get_starred_messages(req, res, next) {}

export async function search_users(req, res, next) {}
