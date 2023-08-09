// Custom Modules
import User from '../../models/user.js';
import { usernameSchema } from '../../config/joi.js';
import { get_jwt } from '../helpers/auth.js';

export async function get_profile(req, res) {
  try {
    const user = await User.findById(req.userId).select(
      'email username profilePhoto bio'
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
    const { error } = usernameSchema.validate(username);
    if (error)
      return res.status(400).json({ errors: { username: 'Invalid username' } });

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
    const user = await User.findById(req.userId)
      .select('friends')
      .populate(
        'friends.friendId',
        'username profilePhoto bio onlineStatus settings'
      );
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ friends: user.friends });
  } catch (error) {
    next(error);
  }
}

export async function get_chats(req, res, next) {
  try {
    res.status(200).json({ chats: populatedChats });
  } catch (error) {
    next(error);
  }
}
