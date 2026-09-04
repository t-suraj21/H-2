import { verifyAuth0Token } from '../utils/jwks.js';
import { verifyToken as verifyLocalJwt } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

/**
 * Primary Authentication Protection Middleware
 *
 * Verifies Auth0 RS256 JWT Access Token against Auth0 JWKS endpoint.
 * Fallback to local JWT verification for test environments.
 * Extracts user identity strictly from verified token 'sub' / 'userId'.
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

    if (!token || token.trim() === '') {
      return sendError(res, 'Authentication token missing.', 401, ERROR_CODES.AUTH_FAILURE);
    }

    let decoded = null;
    let isAuth0 = false;

    // 1. Attempt Auth0 RS256 token verification first
    try {
      decoded = await verifyAuth0Token(token);
      isAuth0 = true;
    } catch (auth0Err) {
      if (auth0Err.name === 'TokenExpiredError') {
        return sendError(
          res,
          'Your session has expired. Please log in again.',
          401,
          ERROR_CODES.EXPIRED_JWT
        );
      }

      // 2. Fallback to local HS256 verification (for test suites)
      try {
        decoded = verifyLocalJwt(token);
        isAuth0 = false;
      } catch (localErr) {
        if (localErr.name === 'TokenExpiredError') {
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
    }

    if (!decoded) {
      return sendError(res, 'Malformed token payload.', 401, ERROR_CODES.AUTH_FAILURE);
    }

    let user = null;
    const auth0Id = decoded.sub;

    if (auth0Id) {
      user = await User.findOne({ auth0Id });

      if (!user) {
        // Automatic provisioning for first-time Auth0 authenticated users
        const email =
          decoded.email ||
          decoded['https://hl2.app/email'] ||
          `${auth0Id.replace(/[^a-zA-Z0-9]/g, '_')}@auth0.user`;

        const name =
          decoded.name ||
          decoded.nickname ||
          decoded['https://hl2.app/name'] ||
          'HL² Shopper';

        const avatar =
          decoded.picture ||
          decoded['https://hl2.app/picture'] ||
          null;

        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
          existingEmailUser.auth0Id = auth0Id;
          existingEmailUser.lastLoginAt = new Date();
          if (avatar && !existingEmailUser.avatar) {
            existingEmailUser.avatar = avatar;
          }
          user = await existingEmailUser.save();
        } else {
          user = await User.create({
            auth0Id,
            email,
            name,
            avatar,
            isEmailVerified: !!decoded.email_verified,
            lastLoginAt: new Date(),
          });
        }
      } else {
        user.lastLoginAt = new Date();
        await user.save();
      }
    } else {
      // Local token resolution
      const userId = decoded.userId || decoded.id;
      if (userId) {
        user = await User.findById(userId).select('-password');
      }
    }

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

    req.user = user;
    req.auth = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
