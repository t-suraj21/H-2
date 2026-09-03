import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import { authApi, UserProfile } from '../services/authApi';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on app start
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedToken = await storage.getToken();
      const savedUser = await storage.getUser<UserProfile>();

      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          setUser(savedUser);
        }

        // Verify token with backend
        const res = await authApi.getMe(savedToken);
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          await storage.saveUser(res.data.user);
        } else {
          // Token invalid or expired
          await storage.clearAuth();
          setToken(null);
          setUser(null);
        }
      }
    } catch {
      // Offline fallback: keep cached user if present
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      await storage.saveToken(res.data.token);
      await storage.saveUser(res.data.user);
      return { success: true, message: res.message || 'Login successful' };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      await storage.saveToken(res.data.token);
      await storage.saveUser(res.data.user);
      return { success: true, message: res.message || 'Registration successful' };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = async () => {
    await storage.clearAuth();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    const res = await authApi.getMe(token);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      await storage.saveUser(res.data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
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
