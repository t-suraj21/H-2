import { Router } from 'express';
import { authenticateAuth0 } from '../middleware/auth0.middleware.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get or synchronize the authenticated Auth0 user profile in MongoDB
 * @access  Private (Valid Auth0 RS256 Bearer Token required)
 */
router.get('/me', authenticateAuth0, async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      'Authenticated user profile synchronized successfully',
      {
        user: req.user,
        auth0: {
          sub: req.auth?.sub,
          email: req.auth?.email,
          scope: req.auth?.scope,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/me/preferences
 * @desc    Update authenticated user settings / preferences
 * @access  Private (Auth0 Bearer Token required)
 */
router.put('/me/preferences', authenticateAuth0, async (req, res, next) => {
  try {
    const { currency, countryCode, notifications } = req.body;

    if (currency) req.user.preferences.currency = currency;
    if (countryCode) req.user.preferences.countryCode = countryCode;
    if (notifications) {
      req.user.preferences.notifications = {
        ...req.user.preferences.notifications,
        ...notifications,
      };
    }

    await req.user.save();

    return sendSuccess(
      res,
      'Preferences updated successfully',
      {
        user: req.user,
      },
      200
    );
  } catch (error) {
    next(error);
  }
});

export default router;
