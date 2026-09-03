export interface UserProfile {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'pro' | 'admin';
  tier?: 'free' | 'pro' | 'enterprise';
  avatar?: string | null;
  preferences?: {
    currency?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
  };
  createdAt?: string;
}

export interface AuthSuccessData {
  token: string;
  user: UserProfile;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export const authApi = {
  /**
   * Register new user account
   */
  async register(name: string, email: string, password: string): Promise<ApiResponse<AuthSuccessData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error. Failed to register.',
      };
    }
  },

  /**
   * Log in user
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthSuccessData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error. Failed to log in.',
      };
    }
  },

  /**
   * Fetch currently authenticated user profile
   */
  async getMe(token: string): Promise<ApiResponse<{ user: UserProfile }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const json = await response.json();
      return json;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to fetch user profile.',
      };
    }
  },
};
