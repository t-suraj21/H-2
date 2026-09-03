import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

/**
 * Authentication Protection Middleware
 * Verifies JWT token and attaches authenticated user document to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        'Authentication required. Please provide a valid Bearer token.',
        401,
        ERROR_CODES.AUTH_FAILURE
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 'Authentication token missing.', 401, ERROR_CODES.AUTH_FAILURE);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(
          res,
          'Your session has expired. Please log in again.',
          401,
          ERROR_CODES.EXPIRED_JWT
        );
      }
      return sendError(
        res,
        'Invalid authentication token. Please log in again.',
        401,
        ERROR_CODES.AUTH_FAILURE
      );
    }

    if (!decoded || (!decoded.userId && !decoded.id)) {
      return sendError(res, 'Malformed token payload.', 401, ERROR_CODES.AUTH_FAILURE);
    }

    const userId = decoded.userId || decoded.id;

    // Fetch user from DB
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return sendError(
        res,
        'User associated with this token no longer exists.',
        401,
        ERROR_CODES.AUTH_FAILURE
      );
    }

    if (!user.isActive) {
      return sendError(
        res,
        'User account has been deactivated.',
        403,
        ERROR_CODES.FORBIDDEN
      );
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
