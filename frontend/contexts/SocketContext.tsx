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
  const subscribedLeadsRef = useRef<Set<string>>(new Set());

  // Detect mobile platform
  const isMobile = typeof window !== 'undefined' && 
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());

  // Connect socket function
  const connectSocket = useCallback(() => {
    if (!isAuthenticated || !user) {
      console.log('SocketProvider: Not authenticated, skipping socket connection');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('SocketProvider: No access token available');
      setConnectionStatus('error');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com';
    
    console.log('SocketProvider: Creating socket connection', {
      url: API_URL,
      isMobile,
      hasToken: !!token,
      userEmail: user.email
    });

    setConnectionStatus('connecting');

    // Create socket with mobile-optimized configuration
    const newSocket = io(API_URL, {
      auth: { token },
      transports: isMobile ? ['polling', 'websocket'] : ['websocket', 'polling'],
      timeout: isMobile ? 20000 : 15000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: isMobile ? 2000 : 1000,
      reconnectionDelayMax: isMobile ? 10000 : 5000,
      randomizationFactor: 0.5,
      autoConnect: true,
      forceNew: true,
      withCredentials: true,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('SocketProvider: Socket connected', {
        socketId: newSocket.id,
        transport: newSocket.io?.engine?.transport?.name,
        isMobile
      });
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Re-subscribe to previously subscribed leads
      subscribedLeadsRef.current.forEach(leadId => {
        newSocket.emit('lead:subscribe', { leadId });
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('SocketProvider: Socket disconnected', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('SocketProvider: Connection error', {
        message: error.message,
        description: error.description,
        type: error.type,
        isMobile
      });
      setIsConnected(false);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('SocketProvider: Reconnect attempt', attemptNumber);
      setConnectionStatus('connecting');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('SocketProvider: Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('SocketProvider: Reconnect error', error);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('SocketProvider: Reconnect failed');
      setConnectionStatus('error');
    });

    setSocket(newSocket);
  }, [isAuthenticated, user, isMobile]);

  // Initialize socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      setConnectionStatus('disconnected');
      subscribedLeadsRef.current.clear();
    }
  }, [isAuthenticated, user, connectSocket]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('SocketProvider: Manual reconnection requested');
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    // Small delay before reconnecting
    setTimeout(() => {
      connectSocket();
    }, 1000);
  }, [socket, connectSocket]);

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