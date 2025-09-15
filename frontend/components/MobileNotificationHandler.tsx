import React, { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface MobileNotificationHandlerProps {
  children: React.ReactNode;
}

export default function MobileNotificationHandler({ children }: MobileNotificationHandlerProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isMobile, setIsMobile] = useState(false);
  const { isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    // Detect if running on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };

    setIsMobile(checkMobile());

    // Request notification permission on mobile
    if (checkMobile() && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          console.log('Notification permission:', permission);
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  // Note: Notifications are now handled by the SocketContext
  // The Socket.IO system will trigger notifications through the context callbacks
  // This component now only handles notification permission and display

  const showMobileNotification = (title: string, body: string) => {
    if (!isMobile || notificationPermission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'crm-notification',
        requireInteraction: false,
        silent: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

  // Show connection status for mobile debugging
  if (isMobile && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-black text-white text-xs p-1 text-center">
        Mobile: {isConnected ? 'Connected' : 'Disconnected'} | 
        Notifications: {notificationPermission} | 
        Socket: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    );
  }

  return <>{children}</>;
}
