// Third Party
import bcrypt from 'bcrypt';

// Custom modules
import User from '../../models/user.js';

export const auth_local = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Not authenticated' });

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
