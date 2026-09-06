/**
 * NotificationProvider Base Interface
 * Allows swapping push notification backends (Mock, Expo, OneSignal, APNs)
 */
export class NotificationProvider {
  /**
   * @param {string} name - Provider identifier
   */
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Send a single push notification
   * @param {object} message - { to: string[], title: string, body: string, data?: object }
   * @returns {Promise<object>} Result status and ticket IDs
   */
  async sendPushNotification(message) {
    throw new Error(`sendPushNotification not implemented on ${this.name}`);
  }

  /**
   * Send multiple push notifications in batch
   * @param {Array<object>} messages
   * @returns {Promise<Array<object>>}
   */
  async sendBulkPushNotifications(messages) {
    throw new Error(`sendBulkPushNotifications not implemented on ${this.name}`);
  }
}

export default NotificationProvider;
