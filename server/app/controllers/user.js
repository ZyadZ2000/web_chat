import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
// Custom Modules
import User from '../../models/user.js';
import Chat from '../../models/chat.js';
import Request from '../../models/request.js';

const ITEMS_PER_PAGE = 20;

export async function get_profile(req, res) {
  try {
    const user = await User.findById(req.userId).select(
      '_id email username profilePhoto bio ceatedAt'
    );

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function get_user(req, res) {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username }).select(
      '_id username bio profilePhoto onlineStatus ceatedAt'
    );

    if (!user) return res.status(404).json({ message: 'user not found' });

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function get_friends(req, res) {
  try {
    const page = req.query.page || 1;

    const user = await User.findById(req.userId)
      .select('_id')
      .select({
        friends: { $slice: [(page - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE] },
      });

    if (!user) return res.status(404).json({ message: 'user not found' });

    const friends = await User.find({ _id: { $in: user.friends } }).select(
      '_id username profilePhoto onlineStatus bio ceatedAt'
    );

    if (!friends) return res.status(404).json({ message: 'friends not found' });

    return res.status(200).json({ friends: friends });
  } catch (error) {
    return next(error);
  }
}

export async function get_chats(req, res, next) {
  try {
    const page = req.query.page || 1;

    const user = await User.findById(req.userId)
      .select('_id')
      .select({
        chats: { $slice: [(page - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE] },
      });

    if (!user.chats)
      return res.status(404).json({ message: 'chats not found' });

    const chats = await Chat.find({ _id: { $in: user.chats } })
      .select({
        _id: 1,
        creator: 1,
        name: 1,
        photo: 1,
        description: 1,
        users: 1,
        messages: { $slice: -1 },
        ceatedAt: 1,
      })
      .populate('users', '_id username profilePhoto onlineStatus bio ceatedAt')
      .populate(
        'creator',
        '_id username profilePhoto onlineStatus bio ceatedAt'
      )
      .populate(
        'messages.sender',
        '_id username profilePhoto onlineStatus bio ceatedAt'
      );

    return res.status(200).json({ chats });
  } catch (error) {
    return next(error);
  }
}

export async function get_received_requests(req, res, next) {
  try {
    const page = req.query.page || 1;
    const receivedReqs = await Request.find({ receiver: req.userId })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate('sender', '_id username profilePhoto onlineStatus bio ceatedAt')
      .populate('chat', '_id name photo description ceatedAt');

    return res.status(200).json({ receivedReqs });
  } catch (error) {
    return next(error);
  }
}

export async function get_sent_requests(req, res, next) {
  try {
    const page = req.query.page || 1;
    const sentReqs = await Request.find({ sender: req.userId })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate(
        'receiver',
        '_id username profilePhoto onlineStatus bio ceatedAt'
      )
      .populate('chat', '_id name photo description ceatedAt');

    return res.status(200).json({ sentReqs });
  } catch (error) {
    return next(error);
  }
}

export async function search_users(req, res, next) {
  try {
    const { username } = req.query;
    const page = req.query.page || 1;

    let users;
    if (username) {
      const exactMatchRegex = new RegExp(`^${username}$`, 'i'); // Exact match
      const startsWithRegex = new RegExp(`^${username}`, 'i'); // Start with
      const endsWithRegex = new RegExp(`${username}$`, 'i'); // End with
      const containsRegex = new RegExp(username, 'i'); // Contains

      users = await User.find({
        $or: [
          { username: exactMatchRegex },
          { username: startsWithRegex },
          { username: endsWithRegex },
          { username: containsRegex },
        ],
      })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .select('_id username profilePhoto bio onlineStatus ceatedAt');
    } else {
      users = await User.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .select('_id username profilePhoto bio onlineStatus ceatedAt');
    }

    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
}

export async function update_email(req, res, next) {
  try {
    const { newEmail } = req.body;

    const duplicate = await User.findOne({ email: newEmail }).select('_id');

    if (duplicate)
      return res.status(409).json({ message: 'email already in use' });

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

    const duplicate = await User.findOne({ username: newUsername }).select(
      '_id'
    );

    if (duplicate)
      return res.status(409).json({ message: 'username already in use' });

    req.user.username = newUsername;

    await req.user.save();

    return res.status(200).json({ message: 'Username updated successfully' });
  } catch (error) {
    return next(error);
  }
}
export async function update_password(req, res, next) {
  try {
    const { newPass } = req.body;

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
    const bio = req.body.bio || '';

    await User.updateOne({ _id: req.userId }, { bio: bio });

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

    await User.updateOne(
      { _id: req.userId },
      {
        profilePhoto: profilePhotoFileName,
      }
    );

    return res
      .status(200)
      .json({ message: 'Profile photo updated successfully' });
  } catch (error) {
    return next(error);
  }
}
