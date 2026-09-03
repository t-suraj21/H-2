import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Salted and hashed password string
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(config.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a stored hash
 * @param {string} plainPassword - User entered plain text password
 * @param {string} hashedPassword - Stored bcrypt hash
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(plainPassword, hashedPassword);
};
