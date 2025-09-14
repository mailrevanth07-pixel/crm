import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import RealtimeService from '@/lib/realtimeService';

interface RealtimeContextType {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  startRealtime: () => void;
  stopRealtime: () => void;
  getStatus: () => any;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [realtimeService, setRealtimeService] = useState<RealtimeService | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Detect mobile platform (client-side only)
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()));
    }
  }, []);

  const startRealtime = useCallback(() => {
    if (!isAuthenticated || !user) {
      console.log('RealtimeProvider: Not authenticated, skipping realtime start');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('RealtimeProvider: No access token available');
      setConnectionStatus('error');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com';
    
    console.log('RealtimeProvider: Starting polling-based realtime service', {
      url: API_URL,
      isMobile,
      hasToken: !!token,
      userEmail: user.email
    });

    // Create realtime service with mobile-optimized settings
    const service = new RealtimeService({
      apiUrl: API_URL,
      token,
      pollInterval: isMobile ? 5000 : 3000, // 5 seconds for mobile, 3 seconds for desktop
      retryAttempts: 5,
      retryDelay: 2000
    });

    // Set up callbacks
    service.setCallbacks({
      onNotification: (data) => {
        console.log('RealtimeProvider: Notification received', data);
        // Handle notification display
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.title || 'New Notification', {
            body: data.message,
            icon: '/logo.png'
          });
        }
      },
      onActivity: (data) => {
        console.log('RealtimeProvider: Activity received', data);
        // Handle activity updates
      },
      onPresence: (data) => {
        console.log('RealtimeProvider: Presence received', data);
        // Handle online user updates
      },
      onError: (error) => {
        console.error('RealtimeProvider: Error', error);
        setConnectionStatus('error');
        setIsConnected(false);
      },
      onStatusChange: (status) => {
        console.log('RealtimeProvider: Status changed', status);
        setConnectionStatus(status);
        setIsConnected(status === 'connected');
      }
    });

    service.start();
    setRealtimeService(service);
  }, [isAuthenticated, user, isMobile]);

  const stopRealtime = useCallback(() => {
    if (realtimeService) {
      console.log('RealtimeProvider: Stopping realtime service');
      realtimeService.stop();
      setRealtimeService(null);
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [realtimeService]);

  const getStatus = useCallback(() => {
    if (!realtimeService) {
      return { isRunning: false, retryCount: 0, lastPollTime: 0, timeSinceLastPoll: null };
    }
    return realtimeService.getStatus();
  }, [realtimeService]);

  // Initialize realtime when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      startRealtime();
    } else {
      stopRealtime();
    }
  }, [isAuthenticated, user, startRealtime, stopRealtime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealtime();
    };
  }, [stopRealtime]);

  const value = {
    isConnected,
    connectionStatus,
    startRealtime,
    stopRealtime,
    getStatus
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
