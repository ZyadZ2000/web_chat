// Third Party
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Custom modules
import User from '../../models/user.js';

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

export const auth_jwt = async (req, res, next) => {
  let decodedToken;
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const token = authHeader.split(' ')[1];
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(error);
  }
  if (!decodedToken) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  req.userId = decodedToken.userId;
  next();
};
