// Third Party
import bcrypt from 'bcrypt';

// Custom modules
import User from '../../models/user';

async function signup(req, res, next) {
  try {
    const { email, password, username } = req.body;

    const oldUser = await User.findOne({
      $or: { email: email, username: username },
    });

    if (oldUser)
      return res.status(409).json({ message: 'User already exists!' });

    const profilePictureFilename = req.file?.filename || 'default_profile.png';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: username,
      email: email,
      password: hashedPassword,
      profilePhoto: profilePictureFilename,
    });

    await user.save();

    return res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    return next(error);
  }
}

function login(req, res, next) {
  console.log('login');
}

function reset_password(req, res, next) {
  console.log('reset_password');
}

function reset_confirm(req, res, next) {
  console.log('confirm_password');
}
