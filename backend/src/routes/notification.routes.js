import { Router } from 'express';
import {
  registerPushToken,
  getNotificationHistory,
  sendTestNotification,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/notifications/register-token
 * @desc    Register device push token
 * @access  Private
 */
router.post('/register-token', registerPushToken);

/**
 * @route   GET /api/notifications/history
 * @desc    Get user's notification delivery log
 * @access  Private
 */
router.get('/history', getNotificationHistory);

/**
 * @route   POST /api/notifications/test
 * @desc    Trigger test push notification
 * @access  Private
 */
router.post('/test', sendTestNotification);

export default router;
