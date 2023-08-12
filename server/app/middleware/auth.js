// Third Party
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Custom modules
import User from '../../models/user.js';
import validate_fields from '../../utils/validation.js';
import * as validationSchemas from '../../config/joi.js';

const get_jwt = (req) => {
  let decodedToken;
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return null;
  }
  const token = authHeader.split(' ')[1];

  decodedToken = jwt.verify(token, process.env.JWT_SECRET);

  return decodedToken;
};

export const auth_local = (fetchData) => {
  return async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = fetchData
        ? await User.findOne({ email: email }).select(
            '_id email username profilePhoto bio settings chats starredMessages friends'
          )
        : await User.findOne({ email: email }).select('_id');

      if (!user) return res.status(401).json({ message: 'Not authenticated' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: 'Not authenticated' });

      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };
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
