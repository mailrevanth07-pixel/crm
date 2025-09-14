import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import socketManager from '../lib/socketManager';

interface SocketContextType {
  socket: any; // SocketManager instance
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const { isAuthenticated, user } = useAuth();
  const subscribedLeadsRef = useRef<Set<string>>(new Set());

  // Initialize socket manager when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('SocketProvider: Initializing socket manager for authenticated user');
      socketManager.init();
    } else {
      console.log('SocketProvider: User not authenticated, destroying socket manager');
      socketManager.destroy();
      setIsConnected(false);
      setConnectionStatus('disconnected');
      subscribedLeadsRef.current.clear();
    }
  }, [isAuthenticated, user]);

  // Monitor connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      const status = socketManager.getConnectionStatus();
      setIsConnected(status.connected);
      
      if (status.connected) {
        setConnectionStatus('connected');
      } else if (status.connecting) {
        setConnectionStatus('connecting');
      } else {
        setConnectionStatus('disconnected');
      }
    };

    // Check status immediately
    checkConnectionStatus();

    // Set up interval to check status
    const interval = setInterval(checkConnectionStatus, 1000);

    // Listen to socket events for real-time updates
    const handleConnect = () => {
      console.log('SocketProvider: Socket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Re-subscribe to previously subscribed leads
      subscribedLeadsRef.current.forEach(leadId => {
        socketManager.emit('lead:subscribe', { leadId });
      });
    };

    const handleDisconnect = () => {
      console.log('SocketProvider: Socket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleConnectError = () => {
      console.log('SocketProvider: Socket connection error');
      setIsConnected(false);
      setConnectionStatus('error');
    };

    const handleReconnecting = () => {
      console.log('SocketProvider: Socket reconnecting');
      setConnectionStatus('connecting');
    };

    // Register event listeners
    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);
    socketManager.on('connect_error', handleConnectError);
    socketManager.on('reconnect_attempt', handleReconnecting);

    return () => {
      clearInterval(interval);
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
      socketManager.off('connect_error', handleConnectError);
      socketManager.off('reconnect_attempt', handleReconnecting);
    };
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('SocketProvider: Manual reconnection requested');
    socketManager.reconnect();
  }, []);

  // Subscribe to lead function
  const subscribeToLead = useCallback((leadId: string) => {
    if (isConnected) {
      socketManager.emit('lead:subscribe', { leadId });
      subscribedLeadsRef.current.add(leadId);
    }
  }, [isConnected]);

  // Unsubscribe from lead function
  const unsubscribeFromLead = useCallback((leadId: string) => {
    if (isConnected) {
      socketManager.emit('lead:unsubscribe', { leadId });
      subscribedLeadsRef.current.delete(leadId);
    }
  }, [isConnected]);

  const value = {
    socket: socketManager, // Expose the socket manager instance
    isConnected,
    connectionStatus,
    reconnect,
    subscribeToLead,
    unsubscribeFromLead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};