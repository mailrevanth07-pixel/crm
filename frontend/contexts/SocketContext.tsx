import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { useRealtime } from './RealtimeContext';

interface SocketContextType {
  socket: any; // Mock socket object for compatibility
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
  const { isConnected, connectionStatus, startRealtime, stopRealtime } = useRealtime();
  const subscribedLeadsRef = useRef<Set<string>>(new Set());

  // Create a mock socket object for compatibility
  const mockSocket = {
    id: 'polling-socket',
    connected: isConnected,
    emit: (event: string, data: any) => {
      console.log('Mock socket emit:', event, data);
      // In a real implementation, you might want to handle specific events
    },
    on: (event: string, callback: Function) => {
      console.log('Mock socket on:', event);
      // In a real implementation, you might want to handle specific events
    },
    off: (event: string, callback: Function) => {
      console.log('Mock socket off:', event);
      // In a real implementation, you might want to handle specific events
    },
    disconnect: () => {
      console.log('Mock socket disconnect');
      stopRealtime();
    },
    connect: () => {
      console.log('Mock socket connect');
      startRealtime();
    }
  };

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('SocketProvider: Manual reconnection requested');
    stopRealtime();
    setTimeout(() => {
      startRealtime();
    }, 1000);
  }, [startRealtime, stopRealtime]);

  // Subscribe to lead function (mock implementation)
  const subscribeToLead = useCallback((leadId: string) => {
    console.log('SocketProvider: Subscribe to lead', leadId);
      subscribedLeadsRef.current.add(leadId);
  }, []);

  // Unsubscribe from lead function (mock implementation)
  const unsubscribeFromLead = useCallback((leadId: string) => {
    console.log('SocketProvider: Unsubscribe from lead', leadId);
      subscribedLeadsRef.current.delete(leadId);
  }, []);

  const value = {
    socket: mockSocket,
    isConnected,
    connectionStatus,
    reconnect,
    subscribeToLead,
    unsubscribeFromLead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};