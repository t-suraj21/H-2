import { sendError } from '../utils/response.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate Registration Request Body
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (errors.length > 0) {
    return sendError(res, errors.join('. '), 400, { validationErrors: errors });
  }

  // Normalize data
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate Login Request Body
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return sendError(res, errors.join('. '), 400, { validationErrors: errors });
  }

  // Normalize data
  req.body.email = email.trim().toLowerCase();
  next();
};
