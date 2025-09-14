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
  const reconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttemptsRef.current = 0;
    
    if (socket) {
      socket.disconnect();
    }
    
    // Small delay before reconnecting
    setTimeout(() => {
      // Force reconnection by creating a new socket
      if (isAuthenticated && user) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com';
        const token = localStorage.getItem('accessToken');
        
        if (token) {
          const newSocket = io(API_URL, {
            auth: { token: token },
            transports: ['polling', 'websocket'],
            timeout: 15000,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            autoConnect: true,
            forceNew: true,
            upgrade: true,
            rememberUpgrade: true,
            withCredentials: true
          });
          
          setSocket(newSocket);
        }
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
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connectSocket();
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
      return localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  // Connect socket with enhanced configuration
  const connectSocket = useCallback(() => {
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
    
    const token = getFreshToken();
    
    if (!token) {
      console.error('No access token available for socket connection');
      setConnectionStatus('error');
      return;
    }

    console.log('Attempting socket connection...');
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
      console.log('Socket connected successfully', {
        socketId: newSocket.id,
        transport: newSocket.io.engine?.transport?.name,
        user: user?.email
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

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      // Handle specific error types
      if (error.message === 'Authentication token required' || 
          error.message === 'Invalid authentication token') {
        console.error('Authentication failed, user may need to re-login');
        // Don't attempt reconnection for auth errors
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
  }, [isAuthenticated, user]);

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
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      // Disconnect socket if user is not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        subscribedLeadsRef.current.clear();
      }
    }

    // Cleanup on unmount
    return () => {
      clearReconnectTimeout();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user]); // Removed connectSocket and socket from dependencies

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

