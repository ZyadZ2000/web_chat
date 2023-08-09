// Third Party
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Custom modules
import User from '../../models/user.js';
import { get_jwt } from '../helpers/auth.js';

export const auth_local = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email }).select(
      '_id email username profilePhoto bio settings'
    );
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Not authenticated' });

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export const auth_jwt = (req, res, next) => {
  try {
    const token = get_jwt(req);
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    req.userId = token.userId;
    next();
  } catch (error) {
    return next(error);
  }
};
