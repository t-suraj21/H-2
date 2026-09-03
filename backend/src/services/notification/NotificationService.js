import { NotificationLog } from '../../models/NotificationLog.js';
import { User } from '../../models/User.js';
import { mockPushProvider } from './providers/MockPushProvider.js';
import { expoPushProvider } from './providers/ExpoPushProvider.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class NotificationService {
  constructor(provider = null) {
    // Default to mock provider in test/dev unless explicitly overridden
    this.provider = provider || (config.NODE_ENV === 'production' ? expoPushProvider : mockPushProvider);
  }

  /**
   * Swap notification provider dynamically (e.g. for testing or changing vendors)
   * @param {object} provider - Provider instance implementing NotificationProvider
   */
  setProvider(provider) {
    if (!provider || typeof provider.sendPushNotification !== 'function') {
      throw new Error('Invalid notification provider instance');
    }
    this.provider = provider;
    logger.info(`[NotificationService] Provider switched to: ${provider.name}`);
  }

  /**
   * Format the standardized price drop notification content
   * @param {object} params - { productName, currentPrice, targetPrice, retailerName }
   * @returns {object} { title, body }
   */
  formatPriceDropMessage({ productName, currentPrice, targetPrice, retailerName = 'Amazon' }) {
    const formattedCurrent = `₹${Number(currentPrice).toLocaleString('en-IN')}`;
    const formattedTarget = `₹${Number(targetPrice).toLocaleString('en-IN')}`;

    const title = 'Price Drop Alert';
    const body = `${productName} is now ${formattedCurrent} on ${retailerName}.\nYour target was ${formattedTarget}.`;

    return { title, body };
  }

  /**
   * Dispatch a price drop push notification with duplicate prevention
   * @param {object} params - { alertId, productId, productName, currentPrice, targetPrice, retailerName, userId }
   * @returns {Promise<object>} Dispatch result
   */
  async sendPriceDropAlert({
    alertId,
    productId,
    productName,
    currentPrice,
    targetPrice,
    retailerName = 'Amazon',
    userId,
  }) {
    if (!userId || !alertId) {
      throw new Error('User ID and Alert ID are required for notification dispatch');
    }

    const priceNum = Number(currentPrice);
    const targetNum = Number(targetPrice);

    // 1. Duplicate Check: Has this exact price drop alert been notified already?
    const existingLog = await NotificationLog.findOne({
      user: userId,
      alert: alertId,
      currentPrice: priceNum,
      status: 'SENT',
    });

    if (existingLog) {
      logger.info(
        `[NotificationService] Suppressed duplicate notification for User ${userId}, Alert ${alertId} @ ₹${priceNum}`
      );
      return {
        success: true,
        isDuplicate: true,
        message: 'Notification suppressed: duplicate price drop event',
        logId: existingLog._id,
      };
    }

    // 2. Format the message
    const { title, body } = this.formatPriceDropMessage({
      productName: productName || 'Tracked Product',
      currentPrice: priceNum,
      targetPrice: targetNum,
      retailerName,
    });

    // 3. Find User's Push Tokens
    const userDoc = await User.findById(userId);
    const pushTokens = userDoc?.pushTokens?.map((t) => t.token) || [];

    const notificationData = {
      alertId: alertId.toString(),
      productId: productId?.toString(),
      productName: productName || 'Tracked Product',
      currentPrice: priceNum,
      targetPrice: targetNum,
      retailer: retailerName,
      screen: 'ProductComparison',
    };

    // 4. Dispatch via pluggable provider
    let providerResult = null;
    let deliveryStatus = 'SENT';

    try {
      if (pushTokens.length > 0) {
        providerResult = await this.provider.sendPushNotification({
          to: pushTokens,
          title,
          body,
          data: notificationData,
        });
      } else {
        // Dispatch to active provider with virtual user recipient
        providerResult = await this.provider.sendPushNotification({
          to: [`user_${userId}`],
          title,
          body,
          data: notificationData,
        });
      }
    } catch (err) {
      logger.error(`[NotificationService] Delivery failed: ${err.message}`);
      deliveryStatus = 'FAILED';
    }

    // 5. Persist delivery in NotificationLog for deduplication & user notification inbox
    const notificationRecord = await NotificationLog.create({
      user: userId,
      alert: alertId,
      product: productId,
      retailerName,
      currentPrice: priceNum,
      targetPrice: targetNum,
      channel: 'push',
      title,
      body,
      provider: this.provider.name,
      status: deliveryStatus,
      metadata: {
        providerResult,
        tokensCount: pushTokens.length,
      },
      sentAt: new Date(),
    });

    return {
      success: deliveryStatus === 'SENT',
      isDuplicate: false,
      title,
      body,
      notificationId: notificationRecord._id,
      provider: this.provider.name,
    };
  }

  /**
   * Register or update a mobile device push token for a user
   * @param {string} userId
   * @param {object} params - { token, platform, deviceId }
   */
  async registerPushToken(userId, { token, platform = 'unknown', deviceId }) {
    if (!userId || !token) {
      throw new Error('User ID and push token are required');
    }

    const cleanToken = token.trim();
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.pushTokens) {
      user.pushTokens = [];
    }

    // Check if token already exists for this user
    const existingIndex = user.pushTokens.findIndex(
      (t) => t.token === cleanToken || (deviceId && t.deviceId === deviceId)
    );

    if (existingIndex >= 0) {
      user.pushTokens[existingIndex].token = cleanToken;
      user.pushTokens[existingIndex].platform = platform;
      user.pushTokens[existingIndex].updatedAt = new Date();
    } else {
      user.pushTokens.push({
        token: cleanToken,
        platform,
        deviceId,
        updatedAt: new Date(),
      });
    }

    await user.save();
    logger.info(`[NotificationService] Registered push token for user ${userId} (${platform})`);

    return {
      success: true,
      tokensCount: user.pushTokens.length,
      registeredToken: cleanToken,
    };
  }

  /**
   * Retrieve notification history for a user
   * @param {string} userId
   * @returns {Promise<Array>} List of user notifications
   */
  async getUserNotificationHistory(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const logs = await NotificationLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('product', 'name image brand model')
      .lean();

    return logs.map((log) => ({
      id: log._id,
      title: log.title,
      body: log.body,
      product: log.product,
      retailer: log.retailerName,
      currentPrice: log.currentPrice,
      targetPrice: log.targetPrice,
      channel: log.channel,
      status: log.status,
      sentAt: log.sentAt || log.createdAt,
    }));
  }
}

export const notificationService = new NotificationService();
export default notificationService;
