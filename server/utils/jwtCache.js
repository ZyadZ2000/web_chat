import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// In-memory cache object
const tokenCache = {};
const cacheMaxSize = 30 * 1024 * 1024; // 30 megabytes
let currentCacheSize = 0;

// Verify and cache the JWT
function verifyAndCacheToken(token) {
  return new Promise((resolve, reject) => {
    // Check if the token is cached
    if (tokenCache[token]) {
      // Token is found in cache, resolve with the cached token
      resolve(tokenCache[token]);
    } else {
      // Token is not cached, verify it
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          // Cache the token for future use
          tokenCache[token] = decoded;

          // add the current token length to the cache size
          currentCacheSize += token.length;

          //remove the oldest tokens if the cache size is more than 30mbs
          while (currentCacheSize > cacheMaxSize) {
            const oldestToken = Object.keys(tokenCache)[0];
            delete tokenCache[oldestToken];
            currentCacheSize -= oldestToken.length;
          }
          // remove from cache after 1 hour
          setTimeout(() => {
            delete tokenCache[token];
          }, 1000 * 60 * 60);
          resolve(decoded);
        }
      });
    }
  });
}

export default verifyAndCacheToken;
