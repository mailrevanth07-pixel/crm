import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

export default function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Lead events
    const handleLeadCreated = (data: any) => {
      if (data.createdBy.id !== user?.id) {
        addNotification({
          type: 'info',
          title: 'New Lead Created',
          message: `${data.createdBy.name} created a new lead: ${data.lead.company}`,
          data
        });
      }
    };

    const handleLeadUpdated = (data: any) => {
      if (data.updatedBy.id !== user?.id) {
        addNotification({
          type: 'info',
          title: 'Lead Updated',
          message: `${data.updatedBy.name} updated lead: ${data.lead.company}`,
          data
        });
      }
    };

    const handleLeadAssigned = (data: any) => {
      if (data.assignedBy.id !== user?.id) {
        addNotification({
          type: 'warning',
          title: 'Lead Assigned',
          message: `${data.assignedBy.name} assigned lead ${data.lead.company} to ${data.lead.owner?.name || 'someone'}`,
          data
        });
      }
    };

    // Activity events
    const handleActivityCreated = (data: any) => {
      if (data.createdBy.id !== user?.id) {
        addNotification({
          type: 'info',
          title: 'New Activity',
          message: `${data.createdBy.name} added a ${data.activity.type} to lead`,
          data
        });
      }
    };

    // Connection events
    const handleConnected = (data: any) => {
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates are now active',
        data
      });
    };

    const handleHealthStatus = (data: any) => {
      // Optional: Show connection health
    };

    const handleMaintenanceNotice = (data: any) => {
      addNotification({
        type: 'warning',
        title: 'Maintenance Notice',
        message: data.message,
        data
      });
    };

    // Register event listeners
    socket.on('lead:created', handleLeadCreated);
    socket.on('lead:updated', handleLeadUpdated);
    socket.on('lead:assigned', handleLeadAssigned);
    socket.on('activity:created', handleActivityCreated);
    socket.on('connected', handleConnected);
    socket.on('health:status', handleHealthStatus);
    socket.on('maintenance:notice', handleMaintenanceNotice);

    // Cleanup
    return () => {
      socket.off('lead:created', handleLeadCreated);
      socket.off('lead:updated', handleLeadUpdated);
      socket.off('lead:assigned', handleLeadAssigned);
      socket.off('activity:created', handleActivityCreated);
      socket.off('connected', handleConnected);
      socket.off('health:status', handleHealthStatus);
      socket.off('maintenance:notice', handleMaintenanceNotice);
    };
  }, [socket, isConnected, user]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep only last 10

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out ${getNotificationColor(notification.type)}`}
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{notification.title}</h4>
                <p className="text-xs mt-1">{notification.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
