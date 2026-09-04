import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Auth0Provider, useAuth0 } from 'react-native-auth0';
import { authConfig } from '../auth/authConfig';
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

const AuthInternalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    authorize,
    clearSession,
    getCredentials,
    user: auth0User,
    isLoading: auth0Loading,
    error: auth0Error,
  } = useAuth0();

  const [appUser, setAppUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Synchronize authenticated user with backend MongoDB /api/users/me
  const syncUserWithBackend = useCallback(async (token: string): Promise<UserProfile | null> => {
    try {
      const res = await apiClient.get<{ user: UserProfile }>('/users/me', { token });
      if (res.success && res.data?.user) {
        setAppUser(res.data.user);
        await storage.saveUser(res.data.user);
        return res.data.user;
      }
    } catch {
      // Offline fallback: load cached user profile
      const cached = await storage.getUser<UserProfile>();
      if (cached) {
        setAppUser(cached);
        return cached;
      }
    }
    return null;
  }, []);

  // Retrieve fresh access token with API audience from Auth0 Credentials Manager
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      // Try to get fresh credentials from SDK Credentials Manager
      const credentials = await getCredentials(authConfig.scope, undefined, {
        audience: authConfig.audience,
      });

      if (credentials?.accessToken) {
        setAccessToken(credentials.accessToken);
        await storage.saveToken(credentials.accessToken);
        return credentials.accessToken;
      }
    } catch {
      // Fallback to local storage token if offline
    }

    const savedToken = await storage.getToken();
    return savedToken;
  }, [getCredentials]);

  // Provide token to centralized apiClient
  useEffect(() => {
    apiClient.setTokenProvider(getAccessToken);
  }, [getAccessToken]);

  // Restore session on app start
  useEffect(() => {
    let isCancelled = false;

    const restoreSession = async () => {
      try {
        setIsInitializing(true);
        const token = await getAccessToken();
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
          setIsInitializing(false);
        }
      }
    };

    restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [getAccessToken, syncUserWithBackend]);

  // Universal Login (Email / Password / Social via Auth0 Universal Login)
  const login = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const credentials = await authorize(
        {
          scope: authConfig.scope,
          audience: authConfig.audience,
        },
        {
          customScheme: authConfig.customScheme,
        }
      );

      if (credentials?.accessToken) {
        setAccessToken(credentials.accessToken);
        await storage.saveToken(credentials.accessToken);
        await syncUserWithBackend(credentials.accessToken);
        return { success: true };
      }

      return { success: false, message: 'Authentication completed but no access token was returned.' };
    } catch (err: any) {
      const errorMsg = err?.message || 'Login cancelled or failed.';
      // User cancelled login flow
      if (err?.error === 'a0.session.user_cancelled' || errorMsg.includes('cancelled')) {
        return { success: false, message: 'Login cancelled.' };
      }
      return { success: false, message: errorMsg };
    }
  }, [authorize, syncUserWithBackend]);

  // Universal Login Sign Up (Opens Auth0 Universal Login on signup tab)
  const register = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const credentials = await authorize(
        {
          scope: authConfig.scope,
          audience: authConfig.audience,
          additionalParameters: {
            screen_hint: 'signup',
          },
        },
        {
          customScheme: authConfig.customScheme,
        }
      );

      if (credentials?.accessToken) {
        setAccessToken(credentials.accessToken);
        await storage.saveToken(credentials.accessToken);
        await syncUserWithBackend(credentials.accessToken);
        return { success: true };
      }

      return { success: false, message: 'Registration completed but no access token was returned.' };
    } catch (err: any) {
      const errorMsg = err?.message || 'Sign up cancelled or failed.';
      if (err?.error === 'a0.session.user_cancelled' || errorMsg.includes('cancelled')) {
        return { success: false, message: 'Sign up cancelled.' };
      }
      return { success: false, message: errorMsg };
    }
  }, [authorize, syncUserWithBackend]);

  // Direct Google Social Login via Auth0 Universal Login
  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const credentials = await authorize(
        {
          scope: authConfig.scope,
          audience: authConfig.audience,
          connection: 'google-oauth2',
        },
        {
          customScheme: authConfig.customScheme,
        }
      );

      if (credentials?.accessToken) {
        setAccessToken(credentials.accessToken);
        await storage.saveToken(credentials.accessToken);
        await syncUserWithBackend(credentials.accessToken);
        return { success: true };
      }

      return { success: false, message: 'Google authentication completed but no token returned.' };
    } catch (err: any) {
      const errorMsg = err?.message || 'Google sign in cancelled or failed.';
      if (err?.error === 'a0.session.user_cancelled' || errorMsg.includes('cancelled')) {
        return { success: false, message: 'Google sign in cancelled.' };
      }
      return { success: false, message: errorMsg };
    }
  }, [authorize, syncUserWithBackend]);

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
      await clearSession(
        {},
        {
          customScheme: authConfig.customScheme,
        }
      );
    } catch {
      // Continue clearing local state even if network logout fails
    } finally {
      await storage.clearAuth();
      setAccessToken(null);
      setAppUser(null);
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const token = await getAccessToken();
    if (token) {
      await syncUserWithBackend(token);
    }
  }, [getAccessToken, syncUserWithBackend]);

  const isAuthenticated = useMemo(() => {
    return !!accessToken && (!!appUser || !!auth0User);
  }, [accessToken, appUser, auth0User]);

  const isLoading = auth0Loading || isInitializing;

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Auth0Provider domain={authConfig.domain} clientId={authConfig.clientId}>
      <AuthInternalProvider>{children}</AuthInternalProvider>
    </Auth0Provider>
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
