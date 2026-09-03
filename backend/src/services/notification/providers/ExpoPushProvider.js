import { NotificationProvider } from './NotificationProvider.js';
import { logger } from '../../../utils/logger.js';

/**
 * ExpoPushProvider for production mobile push delivery to iOS and Android devices
 */
export class ExpoPushProvider extends NotificationProvider {
  constructor() {
    super('expo');
    this.endpoint = 'https://exp.host/--/api/v2/push/send';
  }

  /**
   * Check if token is a valid Expo Push token format
   */
  isValidExpoToken(token) {
    return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
  }

  /**
   * Send push notification via Expo HTTP API
   */
  async sendPushNotification({ to, title, body, data = {} }) {
    const tokens = (Array.isArray(to) ? to : [to]).filter((t) => this.isValidExpoToken(t));

    if (tokens.length === 0) {
      logger.warn('[ExpoPushProvider] No valid Expo push tokens found in recipient list');
      return {
        success: false,
        message: 'No valid Expo push tokens provided',
        provider: 'expo',
      };
    }

    const payload = tokens.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      channelId: 'price-alerts',
    }));

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      logger.info(`[ExpoPushProvider] Dispatched ${tokens.length} push notification(s)`);

      return {
        success: true,
        tickets: json.data || [],
        provider: 'expo',
      };
    } catch (error) {
      logger.error(`[ExpoPushProvider] Delivery error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: 'expo',
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkPushNotifications(messages = []) {
    const results = [];
    for (const msg of messages) {
      const res = await this.sendPushNotification(msg);
      results.push(res);
    }
    return results;
  }
}

export const expoPushProvider = new ExpoPushProvider();
export default expoPushProvider;
