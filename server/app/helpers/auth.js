import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const get_jwt = (req) => {
  let decodedToken;
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return null;
  }
  const token = authHeader.split(' ')[1];

  decodedToken = jwt.verify(token, process.env.JWT_SECRET);

  return decodedToken;
};
