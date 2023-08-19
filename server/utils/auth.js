import bcrypt from 'bcrypt';
import User from '../models/user.js';

export async function verify_credentials(email, password) {
  const user = await User.findOne({ email: email });

  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return null;

  return user;
}
