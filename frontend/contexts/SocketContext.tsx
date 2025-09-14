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
      // Force polling for mobile to avoid WebSocket issues
      transports: isMobile ? ['polling'] : ['polling', 'websocket'],
      timeout: isMobile ? 30000 : 20000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: isMobile ? 3000 : 2000,
      reconnectionDelayMax: isMobile ? 15000 : 10000,
      randomizationFactor: 0.5,
      autoConnect: true,
      forceNew: true,
      withCredentials: true,
      // Add mobile-specific options
      upgrade: !isMobile, // Disable upgrade on mobile
      rememberUpgrade: false, // Don't remember upgrade on mobile
      // Add ping/pong settings for better connection stability
      pingTimeout: isMobile ? 180000 : 120000, // 3 minutes for mobile, 2 minutes for desktop
      pingInterval: isMobile ? 45000 : 30000, // 45 seconds for mobile, 30 seconds for desktop
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
      console.log('SocketProvider: Socket disconnected', {
        reason,
        isMobile,
        transport: newSocket.io?.engine?.transport?.name
      });
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // For mobile, if it's a transport close, try to reconnect more aggressively
      if (isMobile && reason === 'transport close') {
        console.log('SocketProvider: Mobile transport close detected, scheduling aggressive reconnection');
        setTimeout(() => {
          if (!newSocket.connected) {
            console.log('SocketProvider: Attempting reconnection after transport close');
            newSocket.connect();
          }
        }, 2000);
      }
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

    // Add connection health monitoring
    newSocket.on('ping', () => {
      console.log('SocketProvider: Ping received');
    });

    newSocket.on('pong', (latency) => {
      console.log('SocketProvider: Pong received', { latency });
    });

    // Monitor connection state changes
    newSocket.io?.engine?.on('upgrade', () => {
      console.log('SocketProvider: Transport upgraded to', newSocket.io?.engine?.transport?.name);
    });

    newSocket.io?.engine?.on('upgradeError', (error) => {
      console.error('SocketProvider: Upgrade error', error);
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
    
    // For mobile, use longer delay and force polling
    const delay = isMobile ? 3000 : 1000;
    setTimeout(() => {
      connectSocket();
    }, delay);
  }, [socket, connectSocket, isMobile]);

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