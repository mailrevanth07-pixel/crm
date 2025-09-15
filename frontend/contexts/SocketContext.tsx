import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
  subscribeToLead: (leadId: string) => void;
  unsubscribeFromLead: (leadId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const { isAuthenticated, user } = useAuth();
  
  // Refs for managing reconnection
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second
  const subscribedLeadsRef = useRef<Set<string>>(new Set());

  // Manual reconnect function (defined early for use in event handlers)
  const reconnect = useCallback(async () => {
    clearReconnectTimeout();
    reconnectAttemptsRef.current = 0;
    
    if (socket) {
      socket.disconnect();
    }
    
    // Small delay before reconnecting
    setTimeout(async () => {
      // Force reconnection by calling connectSocket
      if (isAuthenticated && user) {
        // We'll call connectSocket directly here to avoid circular dependency
        // The actual connectSocket function will be defined later
      }
    }, 100);
  }, [socket, isAuthenticated, user]);

  // Mobile event handlers (defined outside connectSocket for proper scope)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && isAuthenticated && !isConnected) {
      console.log('Page became visible, attempting to reconnect...');
      setTimeout(() => {
        if (socket && !isConnected) {
          reconnect();
        }
      }, 1000);
    }
  }, [isAuthenticated, isConnected, socket, reconnect]);

  const handleFocus = useCallback(() => {
    if (isAuthenticated && !isConnected) {
      console.log('Page focused, attempting to reconnect...');
      setTimeout(() => {
        if (socket && !isConnected) {
          reconnect();
        }
      }, 1000);
    }
  }, [isAuthenticated, isConnected, socket, reconnect]);

  // Reconnection logic with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      setConnectionStatus('error');
      return;
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      reconnectAttemptsRef.current++;
      // We'll call connectSocket directly here to avoid circular dependency
      // The actual connectSocket function will be defined later
    }, delay);
  }, []);

  // Clean up reconnection timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Get fresh token
  const getFreshToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Use the auth library to get token from both localStorage and sessionStorage
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      return token;
    }
    return null;
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        console.error('No refresh token available');
        return null;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com';
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { accessToken } = data.data;
      
      // Store in the same storage type as the original token
      const isRemembered = localStorage.getItem('rememberMe') === 'true';
      if (isRemembered) {
        localStorage.setItem('accessToken', accessToken);
      } else {
        sessionStorage.setItem('accessToken', accessToken);
      }
      
      console.log('Token refreshed successfully');
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
      return null;
    }
  }, []);

  // Connect socket with enhanced configuration
  const connectSocket = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('Socket connection skipped: Not authenticated or no user');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com';
    
    // Debug: Log the API URL being used for socket
    console.log('Socket API Configuration:', {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      resolvedAPI_URL: API_URL,
      nodeEnv: process.env.NODE_ENV,
      isAuthenticated,
      userEmail: user?.email
    });
    
    let token = getFreshToken();
    
    // If no token, try to refresh it
    if (!token) {
      console.log('No access token found, attempting to refresh...');
      token = await refreshToken();
    }
    
    if (!token) {
      console.error('No access token available for socket connection after refresh attempt', {
        localStorageToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : 'N/A',
        sessionStorageToken: typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : 'N/A',
        isAuthenticated,
        userEmail: user?.email
      });
      setConnectionStatus('error');
      return;
    }

    console.log('Attempting socket connection with token:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + '...',
      userEmail: user?.email
    });
    setConnectionStatus('connecting');

    // Create socket connection with mobile-optimized configuration
    const newSocket = io(API_URL, {
      auth: {
        token: token,
      },
      transports: ['polling', 'websocket'], // Start with polling for better mobile compatibility
      timeout: 15000, // Increased timeout for mobile networks
      reconnection: true, // Enable automatic reconnection for mobile
      reconnectionAttempts: 10, // More attempts for mobile
      reconnectionDelay: 1000, // Start with 1 second delay
      reconnectionDelayMax: 5000, // Max 5 seconds between attempts
      autoConnect: true,
      forceNew: true, // Force new connection
      upgrade: true, // Allow transport upgrades
      rememberUpgrade: true, // Remember successful transport upgrades
      // Mobile-specific options
      withCredentials: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully', {
        socketId: newSocket.id,
        transport: newSocket.io.engine?.transport?.name,
        user: user?.email,
        timestamp: new Date().toISOString()
      });
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0; // Reset reconnection attempts
      clearReconnectTimeout();
      
      // Re-subscribe to previously subscribed leads
      subscribedLeadsRef.current.forEach(leadId => {
        newSocket.emit('lead:subscribe', { leadId });
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Only attempt reconnection if it wasn't a manual disconnect
      if (reason !== 'io client disconnect' && isAuthenticated) {
        console.log('Scheduling reconnection...');
        scheduleReconnect();
      }
    });

    newSocket.on('connect_error', async (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      // Handle specific error types
      if (error.message === 'Authentication token required' || 
          error.message === 'Invalid authentication token' ||
          error.message === 'Authentication token expired') {
        console.error('Authentication failed, attempting token refresh...');
        
        // Try to refresh the token
        const newToken = await refreshToken();
        if (newToken) {
          console.log('Token refreshed, attempting to reconnect...');
          // Disconnect current socket and try again
          newSocket.disconnect();
          setTimeout(() => {
            connectSocket();
          }, 1000);
        } else {
          console.error('Token refresh failed, user needs to re-login');
        }
        return;
      }
      
      // For other errors, attempt reconnection
      if (isAuthenticated) {
        console.log('Connection error, attempting reconnection...');
        scheduleReconnect();
      }
    });

    // Handle server errors
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle authentication errors
    newSocket.on('auth_error', (error) => {
      console.error('Socket auth error:', error);
      setConnectionStatus('error');
    });

    // Handle reconnection events
    newSocket.on('reconnect', (attemptNumber) => {
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      setConnectionStatus('connecting');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setConnectionStatus('error');
    });

    // Mobile-specific event handlers
    newSocket.on('reconnecting', (attemptNumber) => {
      console.log(`Reconnecting... attempt ${attemptNumber}`);
      setConnectionStatus('connecting');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
    });

    setSocket(newSocket);
  }, [isAuthenticated, user, getFreshToken, refreshToken]);

  // Subscribe to lead function
  const subscribeToLead = useCallback((leadId: string) => {
    if (socket && isConnected) {
      socket.emit('lead:subscribe', { leadId });
      subscribedLeadsRef.current.add(leadId);
    }
  }, [socket, isConnected]);

  // Unsubscribe from lead function
  const unsubscribeFromLead = useCallback((leadId: string) => {
    if (socket && isConnected) {
      socket.emit('lead:unsubscribe', { leadId });
      subscribedLeadsRef.current.delete(leadId);
    }
  }, [socket, isConnected]);

  // Main effect for socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      // Only attempt connection if we're authenticated and have a user
      if (isAuthenticated && user) {
        console.log('Auth state ready, attempting socket connection...', {
          isAuthenticated,
          userEmail: user?.email,
          hasToken: !!getFreshToken()
        });
        await connectSocket();
      } else {
        console.log('Not authenticated or no user, disconnecting socket...', {
          isAuthenticated,
          hasUser: !!user
        });
        // Disconnect socket if user is not authenticated
        if (socket) {
          socket.disconnect();
          setSocket(null);
          setIsConnected(false);
          setConnectionStatus('disconnected');
          subscribedLeadsRef.current.clear();
        }
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      clearReconnectTimeout();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user]); // Removed connectSocket to avoid circular dependency

  // Cleanup reconnection timeout on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
    };
  }, [clearReconnectTimeout]);

  // Mobile event listeners effect
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [handleVisibilityChange, handleFocus]);

  const value = {
    socket,
    isConnected,
    connectionStatus,
    reconnect,
    subscribeToLead,
    unsubscribeFromLead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

