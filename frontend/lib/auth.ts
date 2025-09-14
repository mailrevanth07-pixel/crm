import Cookies from 'js-cookie';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const auth = {
  // Token management
  setTokens: (tokens: AuthTokens, rememberMe: boolean = false) => {
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        // Store in localStorage for persistent login (30 days)
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('rememberMe', 'true');
      } else {
        // Store in sessionStorage for session-only login
        sessionStorage.setItem('accessToken', tokens.accessToken);
        sessionStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.removeItem('rememberMe');
      }
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window !== 'undefined') {
      // Check both localStorage and sessionStorage
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      return token;
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== 'undefined') {
      // Check both localStorage and sessionStorage
      return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    }
    return null;
  },

  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    }
  },

  // User management
  setUser: (user: User, rememberMe: boolean = false) => {
    if (typeof window !== 'undefined' && user) {
      try {
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Error storing user data:', error);
      }
    }
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      // Check both localStorage and sessionStorage
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        return null;
      }
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        console.error('Invalid user data:', userStr);
        // Clear invalid data
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        return null;
      }
    }
    return null;
  },

  clearUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  },

  // Auth state
  isAuthenticated: (): boolean => {
    return !!auth.getAccessToken();
  },

  logout: () => {
    auth.clearTokens();
    auth.clearUser();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  },

  // Utility function to clear all auth data and reset state
  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
    }
  }
};
