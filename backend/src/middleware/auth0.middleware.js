import { verifyAuth0Token } from '../utils/jwks.js';
import { verifyToken as verifyLocalJwt } from '../utils/jwt.js';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/response.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

/**
 * Production-ready Auth0 JWT Access Token Validation Middleware
 *
 * Validates:
 * - Bearer token presence in Authorization header
 * - RS256 cryptographic signature against Auth0 JWKS
 * - Token issuer matching Auth0 domain
 * - Token audience matching HL² API identifier
 * - Expiration timestamp
 *
 * Derives user identity strictly from verified token 'sub' (auth0Id).
 * Automatically provisions/synchronizes the user in MongoDB.
 */
export const authenticateAuth0 = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        'Authentication required. Please provide a valid Auth0 Bearer token.',
        401,
        ERROR_CODES.AUTH_FAILURE
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      return sendError(
        res,
        'Authentication token missing.',
        401,
        ERROR_CODES.AUTH_FAILURE
      );
    }

    let decoded;
    try {
      decoded = await verifyAuth0Token(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(
          res,
          'Your Auth0 session has expired. Please log in again.',
          401,
          ERROR_CODES.EXPIRED_JWT
        );
      }

      // In test/development environment with placeholder Auth0 domain, fallback to HMAC verification
      if (config.NODE_ENV === 'test' || config.NODE_ENV === 'development') {
        try {
          decoded = verifyLocalJwt(token);
        } catch (localErr) {
          if (localErr.name === 'TokenExpiredError') {
            return sendError(
              res,
              'Your Auth0 session has expired. Please log in again.',
              401,
              ERROR_CODES.EXPIRED_JWT
            );
          }
          return sendError(
            res,
            `Invalid Auth0 token: ${err.message || 'Token verification failed'}`,
            401,
            ERROR_CODES.AUTH_FAILURE
          );
        }
      } else {
        return sendError(
          res,
          `Invalid Auth0 token: ${err.message || 'Token verification failed'}`,
          401,
          ERROR_CODES.AUTH_FAILURE
        );
      }
    }

    // Extract stable subject identifier (e.g. "auth0|12345" or "google-oauth2|67890")
    const auth0Id = decoded.sub;
    if (!auth0Id) {
      return sendError(
        res,
        'Malformed Auth0 token payload: missing sub claim.',
        401,
        ERROR_CODES.AUTH_FAILURE
      );
    }

    // Find or automatically synchronize the user in MongoDB
    let user = await User.findOne({ auth0Id });

    if (!user) {
      // Derive fallback email and name from token claims if present
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

      // Handle edge case where email might already exist with older auth record
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
      // Update last active login timestamp
      user.lastLoginAt = new Date();
      await user.save();
    }

    if (!user.isActive) {
      return sendError(
        res,
        'User account has been deactivated.',
        403,
        ERROR_CODES.FORBIDDEN
      );
    }

    // Attach verified user and token claims to request
    req.user = user;
    req.auth = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticateAuth0;
