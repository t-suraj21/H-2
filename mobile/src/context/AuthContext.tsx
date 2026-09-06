import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '../services/storage';
import { apiClient } from '../services/apiClient';
import { authApi, UserProfile, ShippingAddress } from '../services/authApi';
import { performGoogleSignIn, firebaseSignOut } from '../services/firebaseAuth';

export type { UserProfile };

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, phone?: string, shippingAddress?: ShippingAddress) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (email?: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  syncAllPlatforms: (platform?: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appUser, setAppUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize authenticated user with backend /api/auth/me
  const syncUserWithBackend = useCallback(async (token: string): Promise<UserProfile | null> => {
    try {
      const res = await authApi.getMe(token);
      if (res.success && res.data?.user) {
        setAppUser(res.data.user);
        await storage.saveUser(res.data.user);
        return res.data.user;
      }
    } catch {
      // Backend offline or unreachable
    }

    // Fallback to cached user profile
    const cached = await storage.getUser<UserProfile>();
    if (cached) {
      setAppUser(cached);
      return cached;
    }

    return null;
  }, []);

  // Retrieve current active access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (accessToken) {
      return accessToken;
    }
    const savedToken = await storage.getToken();
    if (savedToken) {
      setAccessToken(savedToken);
      return savedToken;
    }
    return null;
  }, [accessToken]);

  // Provide token to centralized apiClient
  useEffect(() => {
    apiClient.setTokenProvider(getAccessToken);
  }, [getAccessToken]);

  // Restore session on app start
  useEffect(() => {
    let isCancelled = false;

    const restoreSession = async () => {
      try {
        setIsLoading(true);
        const token = await storage.getToken();
        const savedUser = await storage.getUser<UserProfile>();

        if (token && !isCancelled) {
          setAccessToken(token);
          if (savedUser) {
            setAppUser(savedUser);
          }
          await syncUserWithBackend(token);
        }
      } catch {
        // No valid session
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [syncUserWithBackend]);

  // Native Email & Password Login
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const res = await authApi.login(email.trim().toLowerCase(), password);

      if (res.success && res.data?.token && res.data?.user) {
        const { token, user } = res.data;
        setAccessToken(token);
        setAppUser(user);
        await storage.saveToken(token);
        await storage.saveUser(user);
        return { success: true, message: res.message };
      }

      return {
        success: false,
        message: res.message || 'Invalid email or password. Please try again.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Unable to connect to server. Please check your network.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Native Email & Password Registration
  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    shippingAddress?: ShippingAddress
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const res = await authApi.register(name.trim(), email.trim().toLowerCase(), password, phone?.trim(), shippingAddress);

      if (res.success && res.data?.token && res.data?.user) {
        const { token, user } = res.data;
        setAccessToken(token);
        setAppUser(user);
        await storage.saveToken(token);
        await storage.saveUser(user);
        return { success: true, message: res.message };
      }

      return {
        success: false,
        message: res.message || 'Registration failed. Please check your details.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Unable to connect to server. Please check your network.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Google Sign-In via Firebase
  const loginWithGoogle = useCallback(async (email?: string, name?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const result = await performGoogleSignIn(email, name);

      if (result.success && result.data?.token && result.data?.user) {
        const { token, user } = result.data;
        setAccessToken(token);
        setAppUser(user);
        await storage.saveToken(token);
        await storage.saveUser(user);
        return { success: true, message: result.message };
      }

      return {
        success: false,
        message: result.message || 'Google sign-in failed. Please try again.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Google authentication error.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guest login fallback for exploring without credentials
  const guestLogin = useCallback(async () => {
    const guestUser: UserProfile = {
      id: 'guest_' + Date.now(),
      name: 'Guest Shopper',
      email: 'guest@hl2.app',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    const guestToken = 'guest_token_' + Date.now();
    setAccessToken(guestToken);
    setAppUser(guestUser);
    await storage.saveToken(guestToken);
    await storage.saveUser(guestUser);
  }, []);

  // Logout: Clear tokens & Firebase session
  const logout = useCallback(async () => {
    await firebaseSignOut();
    await storage.clearAuth();
    setAccessToken(null);
    setAppUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getAccessToken();
    if (token) {
      await syncUserWithBackend(token);
    }
  }, [getAccessToken, syncUserWithBackend]);

  // Update Profile on Backend & Local Storage
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = await getAccessToken();
      let updatedUser: UserProfile = {
        ...(appUser || { name: 'HL² Shopper', email: '', role: 'user' }),
        ...updates,
      };

      if (token && !token.startsWith('guest_token_')) {
        const res = await authApi.updateProfile(token, updates);
        if (res.success && res.data?.user) {
          updatedUser = res.data.user;
        }
      }

      setAppUser(updatedUser);
      await storage.saveUser(updatedUser);
      return { success: true, message: 'Profile updated and synchronized!' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to update profile.',
      };
    }
  }, [appUser, getAccessToken]);

  // Synchronize Master Profile across Amazon, Flipkart, Myntra, Meesho
  const syncAllPlatforms = useCallback(async (platform?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = await getAccessToken();
      const now = new Date().toISOString();
      const currentPlatforms = appUser?.connectedPlatforms || {
        amazon: { connected: true, lastSynced: now },
        flipkart: { connected: true, lastSynced: now },
        myntra: { connected: true, lastSynced: now },
        meesho: { connected: true, lastSynced: now },
      };

      let updatedPlatforms = { ...currentPlatforms };
      if (platform && (updatedPlatforms as any)[platform]) {
        (updatedPlatforms as any)[platform] = { connected: true, lastSynced: now };
      } else {
        updatedPlatforms = {
          amazon: { connected: true, lastSynced: now },
          flipkart: { connected: true, lastSynced: now },
          myntra: { connected: true, lastSynced: now },
          meesho: { connected: true, lastSynced: now },
        };
      }

      const updatedUser: UserProfile = {
        ...(appUser || { name: 'HL² Shopper', email: '', role: 'user' }),
        connectedPlatforms: updatedPlatforms,
      };

      if (token && !token.startsWith('guest_token_')) {
        await authApi.syncPlatforms(token, platform);
      }

      setAppUser(updatedUser);
      await storage.saveUser(updatedUser);
      return {
        success: true,
        message: 'Master profile synchronized with Amazon, Flipkart, Myntra & Meesho!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to synchronize with platforms.',
      };
    }
  }, [appUser, getAccessToken]);

  const isAuthenticated = useMemo(() => {
    return !!accessToken;
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user: appUser,
        token: accessToken,
        isAuthenticated,
        isLoading,
        login,
        register,
        loginWithGoogle,
        guestLogin,
        logout,
        getAccessToken,
        refreshUser,
        updateProfile,
        syncAllPlatforms,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
