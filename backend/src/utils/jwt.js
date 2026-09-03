import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Generate a signed JWT token
 * @param {object} payload - Data to embed in the token (e.g. { userId, email, role })
 * @param {string} [expiresIn] - Optional custom expiration duration
 * @returns {string} Signed JWT token string
 */
export const generateToken = (payload, expiresIn = config.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256',
  });
};

/**
 * Verify and decode a JWT token with strict algorithm enforcement
 * @param {string} token - Bearer JWT token string
 * @returns {object} Decoded token payload
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET, {
    algorithms: ['HS256'],
  });
};
