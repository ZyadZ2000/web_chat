// Third Party
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';

// Node Modules
import crypto from 'crypto';
import util from 'util';
import { fileURLToPath } from 'url';
import path from 'path';

// Custom modules
import User from '../../models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function signup(req, res, next) {
  try {
    const { email, password, username } = req.body;

    const oldUser = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (oldUser)
      return res
        .status(409)
        .json({ message: 'email or username already used!' });

    const profilePhotoFilename = req.file?.filename || 'default_profile.png';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: username,
      email: email,
      password: hashedPassword,
      profilePhoto: profilePhotoFilename,
    });

    await user.save();

    return res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    return next(error);
  }
}

export function login(req, res, next) {
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  if (!token) return next(new Error('Could not sign token'));

  return res.status(200).send({
    token,
    user: {
      _id: req.user._id,
      email: req.user.email,
      bio: req.user.bio,
      profilePhoto: req.user.profilePhoto,
      createdAt: req.user.createdAt,
    },
  });
}

export async function reset_password(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: 'user not found' });

    const randomBytesAsync = util.promisify(crypto.randomBytes);
    const buffer = await randomBytesAsync(32);
    const token = buffer.toString('hex');

    user.token = token;
    user.tokenExpiration = Date.now() + 3600000;
    await user.save();

    await sgMail.send({
      to: email,
      from: 'chat.app.node.2023@gmail.com',
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset</p>
        <p>Click this <a href="http://localhost:3000/auth/reset/${token}">link</a> to set a new password.</p>`,
    });

    return res.status(200).json({ message: 'Email sent.' });
  } catch (error) {
    next(error);
  }
}

export function get_reset(req, res, next) {
  const resetToken = req.params.resetToken;
  return res.render('resetPass', {
    resetToken: resetToken,
  });
}

export async function reset_confirm(req, res, next) {
  try {
    const { email, password, resetToken } = req.body;

    const foundUser = await User.findOne({
      email: email,
      token: resetToken,
      tokenExpiration: { $gt: Date.now() },
    });

    if (!foundUser) return res.status(404).send('User not found!');

    const hashedPassword = await bcrypt.hash(password, 10);
    foundUser.password = hashedPassword;
    foundUser.token = undefined;
    foundUser.tokenExpiration = undefined;
    await foundUser.save();
    return res.status(201).send('Password reset successfully! Go to login');
  } catch (error) {
    return next(error);
  }
}
