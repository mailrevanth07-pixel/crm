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
    if (!isAuthenticated || !user) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com';
    const token = getFreshToken();
    
    if (!token) {
      console.error('No access token available for socket connection');
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('connecting');

    // Create socket connection with enhanced configuration
    const newSocket = io(API_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000, // 10 second connection timeout
      reconnection: false, // We'll handle reconnection manually
      autoConnect: true,
      forceNew: true, // Force new connection
    });

    // Connection event handlers
    newSocket.on('connect', () => {
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
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Only attempt reconnection if it wasn't a manual disconnect
      if (reason !== 'io client disconnect' && isAuthenticated) {
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

    setSocket(newSocket);
  }, [isAuthenticated, user]); // Removed getFreshToken, scheduleReconnect, clearReconnectTimeout

  // Manual reconnect function
  const reconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttemptsRef.current = 0;
    
    if (socket) {
      socket.disconnect();
    }
    
    // Small delay before reconnecting
    setTimeout(() => {
      connectSocket();
    }, 100);
  }, [socket]); // Removed connectSocket and clearReconnectTimeout from dependencies

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

