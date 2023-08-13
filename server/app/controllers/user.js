import bcrypt from 'bcrypt';

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
      '_id username bio profilePhoto onlineStatus'
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function get_friends(req, res) {
  try {
    const { friendIds } = req.body;
    const friends = await User.find({ _id: { $in: friendIds } }).select(
      '_id username profilePhoto bio onlineStatus'
    );

    if (!friends) return res.status(404).json({ message: 'Users not found' });

    return res.status(200).json({ friends: friends });
  } catch (error) {
    return next(error);
  }
}

export async function get_chats(req, res, next) {
  try {
    const { chatIds } = req.body;

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
          'users.onlineStatus': 1,
          'users.bio': 1,
          messages: { $slice: ['$messages', -1] },
          'messages.senderId': 1,
          'messages.content': 1,
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
      return res.status(404).json({ message: 'No sent requests' });

    return res.status(200).json({ sentReqs });
  } catch (error) {
    return next(error);
  }
}

export async function get_starred_messages(req, res, next) {
  try {
    const { messageIds } = req.body;
    const messages = await Chat.aggregate([
      {
        $match: { 'chat.messages._id': { $in: messageIds } },
      },
      {
        $lookup: {
          from: 'users',
          let: { senderId: '$chat.messages.senderId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$senderId'] } } },
            { $project: { _id: 0, username: 1, profilePhoto: 1 } },
          ],
          as: 'chat.messages.sender',
        },
      },
      {
        $project: {
          _id: 0,
          'chat.messages._id': 1,
          'chat.messages.content': 1,
          'chat.messages.sender': 1,
        },
      },
    ]);

    if (!messages)
      return res
        .status(404)
        .json({ message: 'No starred messages were found' });

    return res.status(200).json({ messages });
  } catch (error) {
    return next(error);
  }
}

export async function search_users(req, res, next) {
  try {
    const { username } = req.query;

    const exactMatchRegex = new RegExp(`^${username}$`, 'i'); // Exact match
    const startsWithRegex = new RegExp(`^${username}`, 'i'); // Start with
    const endsWithRegex = new RegExp(`${username}$`, 'i'); // End with
    const containsRegex = new RegExp(username, 'i'); // Contains

    const users = await User.find({
      $or: [
        { username: exactMatchRegex },
        { username: startsWithRegex },
        { username: endsWithRegex },
        { username: containsRegex },
      ],
    }).select('_id username profilePhoto bio onlineStatus');

    if (!users) return res.status(404).json({ message: 'No users found' });

    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
}

export async function update_email(req, res, next) {
  try {
    const { newEmail } = req.body;

    req.user.email = newEmail;

    await req.user.save();

    return res.status(200).json({ message: 'Email updated successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function update_username(req, res, next) {
  try {
    const { newUsername } = req.body;

    req.user.username = newUsername;

    await req.user.save();

    return res.status(200).json({ message: 'Username updated successfully' });
  } catch (error) {
    return next(error);
  }
}
export async function update_password(req, res, next) {
  try {
    const { newPass } = req.newPass;

    const hashedPassword = await bcrypt.hash(newPass, 10);

    req.user.password = hashedPassword;

    await req.user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function update_bio(req, res, next) {
  try {
    const { bio } = req.bio;

    req.user.bio = bio;

    await req.user.save();

    return res.status(200).json({ message: 'Bio updated successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function update_picture(req, res, next) {
  try {
    const profilePhotoFileName = req.file?.filename;

    if (!profilePhotoFileName)
      return res.status(400).json({ message: 'No file uploaded' });

    req.user.profilePhoto = profilePhotoFileName;

    await req.user.save();

    return res
      .status(200)
      .json({ message: 'Profile photo updated successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function delete_user(req, res, next) {
  try {
    await User.findByIdAndDelete(req.user._id);

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return next(error);
  }
}
