import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useMQTT } from './MQTTContext';
import { useSocket } from './SocketContext';
import HybridRealtimeService from '@/lib/hybridRealtimeService';

interface HybridRealtimeContextType {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  startRealtime: () => void;
  stopRealtime: () => void;
  getStatus: () => any;
  isMQTTConnected: boolean;
  isSocketIOConnected: boolean;
}

const HybridRealtimeContext = createContext<HybridRealtimeContextType | undefined>(undefined);

export const useHybridRealtime = () => {
  const context = useContext(HybridRealtimeContext);
  if (context === undefined) {
    throw new Error('useHybridRealtime must be used within a HybridRealtimeProvider');
  }
  return context;
};

interface HybridRealtimeProviderProps {
  children: ReactNode;
}

export const HybridRealtimeProvider: React.FC<HybridRealtimeProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [hybridService, setHybridService] = useState<HybridRealtimeService | null>(null);
  const { isAuthenticated, user } = useAuth();
  const { isConnected: mqttConnected, connectionStatus: mqttStatus } = useMQTT();
  const { isConnected: socketIOConnected } = useSocket();
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
    console.log('HybridRealtimeProvider: startRealtime called', {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      hasExistingService: !!hybridService,
      isServiceRunning: hybridService?.getStatus?.()?.isRunning,
      mqttConnected,
      socketIOConnected,
      isMobile
    });

    if (!isAuthenticated || !user) {
      console.log('HybridRealtimeProvider: Not authenticated or no user, skipping start');
      return;
    }

    if (hasInitialized.current) {
      console.log('HybridRealtimeProvider: Already initialized, skipping start');
      return;
    }

    hasInitialized.current = true;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('HybridRealtimeProvider: No token found');
      setConnectionStatus('error');
      return;
    }

    // Create hybrid service with optimal configuration based on platform
    const service = new HybridRealtimeService({
      apiUrl: API_URL,
      token,
      pollInterval: isMobile ? 10000 : 5000, // More frequent polling on mobile
      retryAttempts: 10,
      retryDelay: 2000,
      useMQTT: true, // Always use MQTT for mobile reliability
      useSocketIO: !isMobile, // Use Socket.IO on desktop
      usePolling: true // Always have polling as fallback
    });

    // Set up callbacks
    service.setCallbacks({
      onNotification: (data) => {
        console.log('HybridRealtimeProvider: Notification received', data);
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
        console.log('HybridRealtimeProvider: Activity received', data);
        // Handle activity updates
        window.dispatchEvent(new CustomEvent('realtime-activity', { detail: data }));
      },
      onPresence: (data) => {
        console.log('HybridRealtimeProvider: Presence received', data);
        // Handle online user updates
        window.dispatchEvent(new CustomEvent('realtime-presence', { detail: data }));
      },
      onLead: (data) => {
        console.log('HybridRealtimeProvider: Lead received', data);
        // Handle lead updates
        window.dispatchEvent(new CustomEvent('realtime-lead', { detail: data }));
      },
      onError: (error) => {
        console.error('HybridRealtimeProvider: Error', error);
        setConnectionStatus('error');
        setIsConnected(false);
        window.dispatchEvent(new CustomEvent('realtime-error', { detail: error }));
      },
      onStatusChange: (status) => {
        console.log('HybridRealtimeProvider: Status changed', status);
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
    setHybridService(service);
  }, [isAuthenticated, user, mqttConnected, socketIOConnected, isMobile]);

  const stopRealtime = useCallback(() => {
    console.log('HybridRealtimeProvider: stopRealtime called');
    
    if (hybridService) {
      hybridService.stop();
      setHybridService(null);
    }
    
    hasInitialized.current = false;
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [hybridService]);

  const getStatus = useCallback(() => {
    if (!hybridService) {
      return {
        isRunning: false,
        retryCount: 0,
        lastPollTime: 0,
        timeSinceLastPoll: null,
        mqttConnected: false,
        socketIOConnected: false
      };
    }
    
    return hybridService.getStatus();
  }, [hybridService]);

  // Auto-start when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !hasInitialized.current) {
      console.log('HybridRealtimeProvider: Auto-starting realtime service');
      startRealtime();
    } else if (!isAuthenticated && hasInitialized.current) {
      console.log('HybridRealtimeProvider: User logged out, stopping realtime service');
      stopRealtime();
    }
  }, [isAuthenticated, user, startRealtime, stopRealtime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hybridService) {
        console.log('HybridRealtimeProvider: Cleaning up on unmount');
        hybridService.stop();
      }
    };
  }, [hybridService]);

  // Update connection status based on underlying services
  useEffect(() => {
    const anyConnected = mqttConnected || socketIOConnected;
    const anyError = mqttStatus === 'error';
    
    if (anyConnected && !isConnected) {
      setIsConnected(true);
      setConnectionStatus('connected');
    } else if (!anyConnected && isConnected) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    } else if (anyError) {
      setConnectionStatus('error');
    }
  }, [mqttConnected, socketIOConnected, mqttStatus, isConnected]);

  const contextValue: HybridRealtimeContextType = {
    isConnected,
    connectionStatus,
    startRealtime,
    stopRealtime,
    getStatus,
    isMQTTConnected: mqttConnected,
    isSocketIOConnected: socketIOConnected
  };

  return (
    <HybridRealtimeContext.Provider value={contextValue}>
      {children}
    </HybridRealtimeContext.Provider>
  );
};
