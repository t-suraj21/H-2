import { useState, useCallback, useEffect } from 'react';
import { mobileNotificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export interface UseNotificationsResult {
  hasPermission: boolean;
  pushToken: string | null;
  requestPermissions: () => Promise<boolean>;
  showInAppAlert: (options: { title: string; body: string; onPress?: () => void }) => void;
}

export const useNotifications = (autoRequest = false): UseNotificationsResult => {
  const { token } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await mobileNotificationService.requestNotificationPermissions(token);
      setHasPermission(granted);
      setPushToken(mobileNotificationService.getToken());
      return granted;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, [token]);

  useEffect(() => {
    if (autoRequest) {
      requestPermissions();
    }
  }, [autoRequest, requestPermissions]);

  const showInAppAlert = useCallback(
    (options: { title: string; body: string; onPress?: () => void }) => {
      mobileNotificationService.displayInAppAlert(options);
    },
    []
  );

  return {
    hasPermission,
    pushToken,
    requestPermissions,
    showInAppAlert,
  };
};
