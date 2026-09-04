import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'hl2_auth_jwt_token';
const USER_KEY = 'hl2_auth_user_profile';

// In-memory fallback for web/testing
const memoryStorage = new Map<string, string>();

export const storage = {
  /**
   * Save auth JWT token securely
   */
  async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch {
      memoryStorage.set(TOKEN_KEY, token);
    }
  },

  /**
   * Retrieve auth JWT token
   */
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return memoryStorage.get(TOKEN_KEY) || null;
    }
  },

  /**
   * Remove auth JWT token
   */
  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      memoryStorage.delete(TOKEN_KEY);
    }
  },

  /**
   * Save serialized user profile
   */
  async saveUser(user: object): Promise<void> {
    try {
      const data = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(USER_KEY, data);
      } else {
        await SecureStore.setItemAsync(USER_KEY, data);
      }
    } catch {
      memoryStorage.set(USER_KEY, JSON.stringify(user));
    }
  },

  /**
   * Retrieve serialized user profile
   */
  async getUser<T>(): Promise<T | null> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem(USER_KEY);
      } else {
        raw = await SecureStore.getItemAsync(USER_KEY);
      }
      if (!raw) {
        raw = memoryStorage.get(USER_KEY) || null;
      }
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  /**
   * Clear all auth credentials on Logout
   */
  async clearAuth(): Promise<void> {
    await this.removeToken();
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch {
      memoryStorage.delete(USER_KEY);
    }
  },

  /**
   * Generic get item from storage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem(key);
      } else {
        raw = await SecureStore.getItemAsync(key);
      }
      if (!raw) {
        raw = memoryStorage.get(key) || null;
      }
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  /**
   * Generic set item in storage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (Platform.OS === 'web') {
        localStorage.setItem(key, data);
      } else {
        await SecureStore.setItemAsync(key, data);
      }
    } catch {
      memoryStorage.set(key, JSON.stringify(value));
    }
  },

  /**
   * Generic remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      memoryStorage.delete(key);
    }
  },
};
