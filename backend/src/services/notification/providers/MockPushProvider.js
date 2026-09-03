import { NotificationProvider } from './NotificationProvider.js';
import { logger } from '../../../utils/logger.js';

/**
 * MockPushProvider for testing, development, and offline environments
 */
export class MockPushProvider extends NotificationProvider {
  constructor() {
    super('mock');
    this.sentHistory = [];
  }

  /**
   * Send mock push notification
   * @param {object} message - { to, title, body, data }
   */
  async sendPushNotification({ to, title, body, data = {} }) {
    const delivery = {
      id: `mock_ticket_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      to: Array.isArray(to) ? to : [to],
      title,
      body,
      data,
      sentAt: new Date().toISOString(),
      provider: 'mock',
      status: 'ok',
    };

    this.sentHistory.push(delivery);

    logger.info(
      `[MockPushProvider] 📱 Push Sent to ${delivery.to.length} recipients: "${title}" - "${body}"`
    );

    return {
      success: true,
      ticketId: delivery.id,
      recipientsCount: delivery.to.length,
      provider: 'mock',
    };
  }

  /**
   * Send bulk mock push notifications
   * @param {Array<object>} messages
   */
  async sendBulkPushNotifications(messages = []) {
    const results = [];
    for (const msg of messages) {
      const res = await this.sendPushNotification(msg);
      results.push(res);
    }
    return results;
  }

  /**
   * Clear in-memory history (for tests)
   */
  clearHistory() {
    this.sentHistory = [];
  }

  /**
   * Get sent history (for tests)
   */
  getHistory() {
    return this.sentHistory;
  }
}

export const mockPushProvider = new MockPushProvider();
export default mockPushProvider;
