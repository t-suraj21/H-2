import { notificationService } from '../services/notification/NotificationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Register or update mobile push notification token
 * POST /api/notifications/register-token
 */
export const registerPushToken = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { token, platform, deviceId } = req.body;

    if (!token) {
      return sendError(res, 'Push notification token is required', 400);
    }

    const result = await notificationService.registerPushToken(userId, {
      token,
      platform,
      deviceId,
    });

    return sendSuccess(
      res,
      'Push token registered successfully',
      result,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification delivery history for authenticated user
 * GET /api/notifications/history
 */
export const getNotificationHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const history = await notificationService.getUserNotificationHistory(userId);

    return sendSuccess(
      res,
      'Notification history retrieved successfully',
      history,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Send a test notification to verify device token
 * POST /api/notifications/test
 */
export const sendTestNotification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { message = 'Test notification from HL²' } = req.body;

    const result = await notificationService.provider.sendPushNotification({
      to: [`user_${userId}`],
      title: 'HL² Test Notification',
      body: message,
      data: { test: true },
    });

    return sendSuccess(
      res,
      'Test notification dispatched',
      result,
      200
    );
  } catch (error) {
    next(error);
  }
};
