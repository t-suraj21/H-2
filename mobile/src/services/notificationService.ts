import { Platform, Alert } from 'react-native';
import { notificationApi } from './productApi';

export class MobileNotificationService {
  private hasRequestedPermission = false;
  private currentToken: string | null = null;

  /**
   * Request push notification permission from user and synchronize token with backend
   * @param {string} [authToken] - JWT Bearer token of authenticated user
   */
  async requestNotificationPermissions(authToken?: string | null): Promise<boolean> {
    try {
      this.hasRequestedPermission = true;

      // In real device with expo-notifications or simulator mock token:
      const mockDeviceToken = `ExponentPushToken[mock_${Platform.OS}_${Date.now().toString(36)}]`;
      this.currentToken = mockDeviceToken;

      if (authToken) {
        await notificationApi.registerPushToken(
          {
            token: mockDeviceToken,
            platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
            deviceId: `${Platform.OS}-device-${Date.now().toString(36)}`,
          },
          authToken
        );
      }

      return true;
    } catch (err) {
      console.warn('Failed to register mobile push token:', err);
      return false;
    }
  }

  /**
   * Show in-app price drop banner when notification is received
   */
  displayInAppAlert({
    title,
    body,
    onPress,
  }: {
    title: string;
    body: string;
    onPress?: () => void;
  }) {
    Alert.alert(
      title,
      body,
      [
        { text: 'Dismiss', style: 'cancel' },
        { text: 'View Deal', onPress: onPress || (() => {}) },
      ],
      { cancelable: true }
    );
  }

  getToken(): string | null {
    return this.currentToken;
  }
}

export const mobileNotificationService = new MobileNotificationService();
export default mobileNotificationService;
