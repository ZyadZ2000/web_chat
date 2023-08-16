// Third-party libraries
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Import User model
import User from '../../models/user.js';
import verifyAndCacheToken from '../../utils/jwtCache.js';
import { verify_credentials } from '../../utils/auth.js';
// Middleware to handle local authentication
export const auth_local = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user based on the provided email
    const user = await verify_credentials(email, password);

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Attach user object to the request for future middleware
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to handle JWT authentication
export const auth_jwt = async (req, res, next) => {
  try {
    let decodedToken;

    const authHeader = req.get('Authorization');

    // Check if authorization header is provided
    if (!authHeader) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Extract the token from the header
    const token = authHeader.split(' ')[1];

    // Verify the JWT token
    decodedToken = await verifyAndCacheToken(token);

    // Check if token is valid
    if (!decodedToken) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Attach the decoded user ID to the request for future middleware
    req.userId = decodedToken.userId;

    next();
  } catch (error) {
    return next(error);
  }
};
