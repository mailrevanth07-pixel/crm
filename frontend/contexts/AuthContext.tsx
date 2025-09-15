import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { User, auth } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, tokens: { accessToken: string; refreshToken: string }, rememberMe?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated on mount
    const initializeAuth = () => {
      try {
        const storedUser = auth.getUser();
        const accessToken = auth.getAccessToken();
        
        if (accessToken && storedUser) {
          setUser(storedUser);
        } else {
          // Clear any invalid stored data
          auth.clearTokens();
          auth.clearUser();
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        auth.clearTokens();
        auth.clearUser();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: User, tokens: { accessToken: string; refreshToken: string }, rememberMe: boolean = false) => {
    try {
      console.log('AuthContext: Login called', { user: userData.email, rememberMe });
      // Store tokens and user data with remember me preference
      auth.setTokens(tokens, rememberMe);
      auth.setUser(userData, rememberMe);
      setUser(userData);
      console.log('AuthContext: User set, isAuthenticated will be:', !isLoading && !!userData && !!auth.getAccessToken());
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      // Clear all stored data
      auth.clearTokens();
      auth.clearUser();
      setUser(null);
      
      // Redirect to login page
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isAuthenticated = !isLoading && !!user && !!auth.getAccessToken();
  
  // Debug logging for authentication state
  useEffect(() => {
    console.log('Auth state updated:', {
      isLoading,
      hasUser: !!user,
      hasToken: !!auth.getAccessToken(),
      isAuthenticated,
      userEmail: user?.email
    });
  }, [isLoading, user, isAuthenticated]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Higher-order component for protected routes
export const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  return function AuthenticatedComponent(props: any) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        // Preserve the current path as a redirect parameter
        const currentPath = router.asPath;
        const redirectUrl = currentPath === '/' ? '/auth/login' : `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
        router.push(redirectUrl);
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};
