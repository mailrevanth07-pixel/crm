import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
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
  const hasInitialized = useRef(false);

  // Detect mobile platform (client-side only)
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()));
    }
  }, []);

  const startRealtime = useCallback(() => {
    console.log('RealtimeProvider: startRealtime called', {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      hasExistingService: !!realtimeService,
      isServiceRunning: realtimeService?.getStatus?.()?.isRunning
    });

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

    // Don't restart if service is already running
    if (realtimeService && realtimeService.getStatus().isRunning) {
      console.log('RealtimeProvider: Service already running, skipping restart');
      return;
    }

    // Stop existing service if running
    if (realtimeService) {
      console.log('RealtimeProvider: Stopping existing service before starting new one');
      realtimeService.stop();
      setRealtimeService(null);
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
        
        // Also trigger custom event for components to listen to
        window.dispatchEvent(new CustomEvent('realtime-notification', { detail: data }));
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
        
        // Emit connection events
        if (status === 'connected') {
          window.dispatchEvent(new CustomEvent('realtime-connected', { detail: { status } }));
        } else if (status === 'disconnected') {
          window.dispatchEvent(new CustomEvent('realtime-disconnected', { detail: { status } }));
        } else if (status === 'error') {
          window.dispatchEvent(new CustomEvent('realtime-error', { detail: { status } }));
        }
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
    console.log('RealtimeProvider: Auth state changed', { 
      isAuthenticated, 
      user: user?.email, 
      hasInitialized: hasInitialized.current 
    });
    
    if (isAuthenticated && user && !hasInitialized.current) {
      console.log('RealtimeProvider: Starting realtime service');
      hasInitialized.current = true;
      startRealtime();
    } else if (!isAuthenticated && hasInitialized.current) {
      console.log('RealtimeProvider: Stopping realtime service');
      hasInitialized.current = false;
      stopRealtime();
    }
  }, [isAuthenticated, user?.id]); // Only depend on auth state, not the functions

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
