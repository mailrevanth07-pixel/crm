import React, { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface MobileNotificationHandlerProps {
  children: React.ReactNode;
}

export default function MobileNotificationHandler({ children }: MobileNotificationHandlerProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isMobile, setIsMobile] = useState(false);
  const { socket, isConnected } = useSocket();
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

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Handle realtime notifications for mobile
    const handleLeadCreated = (data: any) => {
      if (data.createdBy.id !== user?.id) {
        showMobileNotification(
          'New Lead Created',
          `${data.createdBy.name} created a new lead: ${data.lead.company}`
        );
      }
    };

    const handleLeadUpdated = (data: any) => {
      if (data.updatedBy.id !== user?.id) {
        showMobileNotification(
          'Lead Updated',
          `${data.updatedBy.name} updated lead: ${data.lead.company}`
        );
      }
    };

    const handleActivityCreated = (data: any) => {
      if (data.createdBy.id !== user?.id) {
        showMobileNotification(
          'New Activity',
          `${data.createdBy.name} added a ${data.activity.type} to lead`
        );
      }
    };

    const handleUserOnline = (data: any) => {
      if (data.user.id !== user?.id) {
        showMobileNotification(
          'User Online',
          `${data.user.name || data.user.email} is now online`
        );
      }
    };

    // Register event listeners
    socket.on('lead:created', handleLeadCreated);
    socket.on('lead:updated', handleLeadUpdated);
    socket.on('activity:created', handleActivityCreated);
    socket.on('user:online', handleUserOnline);

    // Cleanup
    return () => {
      socket.off('lead:created', handleLeadCreated);
      socket.off('lead:updated', handleLeadUpdated);
      socket.off('activity:created', handleActivityCreated);
      socket.off('user:online', handleUserOnline);
    };
  }, [socket, isConnected, user]);

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
        Socket: {socket ? 'Ready' : 'Not Ready'}
      </div>
    );
  }

  return <>{children}</>;
}
