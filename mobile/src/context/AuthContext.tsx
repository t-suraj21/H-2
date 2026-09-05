import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authConfig } from '../auth/authConfig';
import { loginWithAuth0, logoutAuth0, decodeJwt, Auth0User } from '../auth/auth0Service';
import { storage } from '../services/storage';
import { apiClient } from '../services/apiClient';

export interface UserProfile {
  id?: string;
  _id?: string;
  auth0Id?: string;
  name: string;
  email: string;
  role: 'user' | 'pro' | 'admin';
  tier?: 'free' | 'pro' | 'enterprise';
  avatar?: string | null;
  preferences?: {
    currency?: string;
    countryCode?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
  };
  createdAt?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<{ success: boolean; message?: string }>;
  register: () => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appUser, setAppUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize authenticated user with backend MongoDB /api/users/me
  const syncUserWithBackend = useCallback(async (token: string, fallbackAuth0User?: Auth0User | null): Promise<UserProfile | null> => {
    try {
      const res = await apiClient.get<{ user: UserProfile }>('/users/me', { token });
      if (res.success && res.data?.user) {
        setAppUser(res.data.user);
        await storage.saveUser(res.data.user);
        return res.data.user;
      }
    } catch {
      // Backend offline or unreachable
    }

    // Try reading cached user profile
    const cached = await storage.getUser<UserProfile>();
    if (cached) {
      setAppUser(cached);
      return cached;
    }

    // Fallback to Auth0 User from decoded token
    const decoded = fallbackAuth0User || decodeJwt(token);
    if (decoded) {
      const fallbackUser: UserProfile = {
        id: decoded.sub || 'user_' + Date.now(),
        auth0Id: decoded.sub,
        name: decoded.name || decoded.nickname || 'HL² Shopper',
        email: decoded.email || '',
        role: 'user',
        avatar: decoded.picture || null,
        createdAt: new Date().toISOString(),
      };
      setAppUser(fallbackUser);
      await storage.saveUser(fallbackUser);
      return fallbackUser;
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

  // Universal Login (Email / Password / Social via Auth0 Universal Login)
  const login = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const { tokens, user } = await loginWithAuth0();
      const token = tokens?.accessToken || tokens?.idToken;

      if (token) {
        setAccessToken(token);
        await storage.saveToken(token);
        await syncUserWithBackend(token, user);
        return { success: true };
      }

      return { success: false, message: 'Authentication completed but no token returned.' };
    } catch (err: any) {
      const errorMsg = err?.message || 'Login cancelled or failed.';
      if (errorMsg.includes('cancelled') || errorMsg.includes('dismissed')) {
        return { success: false, message: 'Login cancelled.' };
      }
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [syncUserWithBackend]);

  // Universal Login Sign Up (Opens Auth0 Universal Login on signup tab)
  const register = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const { tokens, user } = await loginWithAuth0({ screen_hint: 'signup' });
      const token = tokens?.accessToken || tokens?.idToken;

      if (token) {
        setAccessToken(token);
        await storage.saveToken(token);
        await syncUserWithBackend(token, user);
        return { success: true };
      }

      return { success: false, message: 'Registration completed but no token returned.' };
    } catch (err: any) {
      const errorMsg = err?.message || 'Sign up cancelled or failed.';
      if (errorMsg.includes('cancelled') || errorMsg.includes('dismissed')) {
        return { success: false, message: 'Sign up cancelled.' };
      }
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [syncUserWithBackend]);

  // Direct Google Social Login via Auth0
  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const { tokens, user } = await loginWithAuth0({ connection: 'google-oauth2' });
      const token = tokens?.accessToken || tokens?.idToken;

      if (token) {
        setAccessToken(token);
        await storage.saveToken(token);
        await syncUserWithBackend(token, user);
        return { success: true };
      }

      return { success: false, message: 'Google authentication completed but no token returned.' };
    } catch (err: any) {
      const errorMsg = err?.message || 'Google sign in cancelled or failed.';
      if (errorMsg.includes('cancelled') || errorMsg.includes('dismissed')) {
        return { success: false, message: 'Google sign in cancelled.' };
      }
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [syncUserWithBackend]);

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

  // Complete Logout: Clear Auth0 session & local cache
  const logout = useCallback(async () => {
    try {
      await logoutAuth0();
    } catch {
      // Continue clearing local state even if network logout fails
    } finally {
      await storage.clearAuth();
      setAccessToken(null);
      setAppUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getAccessToken();
    if (token) {
      await syncUserWithBackend(token);
    }
  }, [getAccessToken, syncUserWithBackend]);

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
