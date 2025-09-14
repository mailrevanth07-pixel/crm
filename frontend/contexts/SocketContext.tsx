import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { useRealtime } from './RealtimeContext';
import EventEmitter from '@/lib/eventEmitter';

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
  const eventEmitterRef = useRef<EventEmitter>(new EventEmitter());

  // Create a real socket object that uses event emitter
  const socket = {
    id: 'polling-socket',
    connected: isConnected,
    emit: (event: string, data: any) => {
      console.log('Socket emit:', event, data);
      // For now, just log - in future we could send to server
    },
    on: (event: string, callback: Function) => {
      console.log('Socket on:', event);
      eventEmitterRef.current.on(event, callback);
    },
    off: (event: string, callback: Function) => {
      console.log('Socket off:', event);
      eventEmitterRef.current.off(event, callback);
    },
    disconnect: () => {
      console.log('Socket disconnect');
      stopRealtime();
    },
    connect: () => {
      console.log('Socket connect');
      startRealtime();
    }
  };

  // Listen to realtime events and convert them to socket events
  useEffect(() => {
    const handleRealtimeNotification = (event: CustomEvent) => {
      const notification = event.detail;
      console.log('Converting notification to socket event:', notification);
      
      // Convert notification to appropriate socket events
      if (notification.type === 'lead_assigned') {
        eventEmitterRef.current.emit('lead:assigned', {
          lead: notification.data,
          assignedBy: notification.data.assignedBy,
          timestamp: notification.timestamp
        });
      } else if (notification.type === 'lead_created') {
        eventEmitterRef.current.emit('lead:created', {
          lead: notification.data,
          createdBy: notification.data.createdBy,
          timestamp: notification.timestamp
        });
      } else if (notification.type === 'lead_updated') {
        eventEmitterRef.current.emit('lead:updated', {
          lead: notification.data,
          updatedBy: notification.data.updatedBy,
          timestamp: notification.timestamp
        });
      } else if (notification.type === 'activity_created') {
        eventEmitterRef.current.emit('activity:created', {
          activity: notification.data,
          createdBy: notification.data.createdBy,
          timestamp: notification.timestamp
        });
      }
    };

    const handleRealtimeConnected = (event: CustomEvent) => {
      console.log('Realtime connected, emitting socket connected event');
      eventEmitterRef.current.emit('connected', { status: 'connected' });
    };

    const handleRealtimeDisconnected = (event: CustomEvent) => {
      console.log('Realtime disconnected, emitting socket disconnected event');
      eventEmitterRef.current.emit('disconnected', { status: 'disconnected' });
    };

    // Listen to custom events from RealtimeContext
    window.addEventListener('realtime-notification', handleRealtimeNotification as EventListener);
    window.addEventListener('realtime-connected', handleRealtimeConnected as EventListener);
    window.addEventListener('realtime-disconnected', handleRealtimeDisconnected as EventListener);

    return () => {
      window.removeEventListener('realtime-notification', handleRealtimeNotification as EventListener);
      window.removeEventListener('realtime-connected', handleRealtimeConnected as EventListener);
      window.removeEventListener('realtime-disconnected', handleRealtimeDisconnected as EventListener);
    };
  }, []);

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
    socket,
    isConnected,
    connectionStatus,
    reconnect,
    subscribeToLead,
    unsubscribeFromLead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};