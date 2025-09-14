import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastSeen: string;
  isActive: boolean;
}

interface LeadViewer {
  leadId: string;
  user: OnlineUser;
  viewingSince: string;
}

export default function RealtimePresence() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [leadViewers, setLeadViewers] = useState<LeadViewer[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle user presence updates
    const handleUserOnline = (data: any) => {
      setOnlineUsers(prev => {
        const existing = prev.find(u => u.id === data.user.id);
        if (existing) {
          return prev.map(u => u.id === data.user.id ? { ...u, ...data.user, isActive: true } : u);
        }
        return [...prev, { ...data.user, isActive: true }];
      });
    };

    const handleUserOffline = (data: any) => {
      setOnlineUsers(prev => 
        prev.map(u => u.id === data.userId ? { ...u, isActive: false } : u)
      );
    };

    const handleUserViewingLead = (data: any) => {
      setLeadViewers(prev => {
        const existing = prev.find(v => v.leadId === data.leadId && v.user.id === data.user.id);
        if (existing) {
          return prev.map(v => 
            v.leadId === data.leadId && v.user.id === data.user.id 
              ? { ...v, viewingSince: data.timestamp }
              : v
          );
        }
        return [...prev, {
          leadId: data.leadId,
          user: data.user,
          viewingSince: data.timestamp
        }];
      });
    };

    const handleUserStoppedViewingLead = (data: any) => {
      setLeadViewers(prev => 
        prev.filter(v => !(v.leadId === data.leadId && v.user.id === data.userId))
      );
    };

    const handleHealthStatus = (data: any) => {
      // Update user counts based on health status
    };

    // Register event listeners
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('user:viewing_lead', handleUserViewingLead);
    socket.on('user:stopped_viewing_lead', handleUserStoppedViewingLead);
    socket.on('health:status', handleHealthStatus);

    // Cleanup
    return () => {
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('user:viewing_lead', handleUserViewingLead);
      socket.off('user:stopped_viewing_lead', handleUserStoppedViewingLead);
      socket.off('health:status', handleHealthStatus);
    };
  }, [socket, isConnected]);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'sales': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return '👑';
      case 'manager': return '👨‍💼';
      case 'sales': return '💼';
      default: return '👤';
    }
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const activeUsers = onlineUsers.filter(u => u.isActive);
  const currentUserViewers = leadViewers.filter(v => v.user.id !== user?.id);

  return (
    <div className="fixed top-4 left-4 z-40">
      {/* Presence Indicator */}
      <div className="bg-white rounded-lg shadow-lg border p-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {activeUsers.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">
                {activeUsers.length} online
              </span>
            </div>
          )}
        </div>

        {/* Online Users List */}
        {isExpanded && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Online Users</h4>
            {activeUsers.length === 0 ? (
              <p className="text-xs text-gray-500">No other users online</p>
            ) : (
              activeUsers.map(onlineUser => (
                <div key={onlineUser.id} className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                      {onlineUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {onlineUser.name}
                    </p>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs">{getRoleIcon(onlineUser.role)}</span>
                      <span className={`text-xs px-1 py-0.5 rounded ${getRoleColor(onlineUser.role)}`}>
                        {onlineUser.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Lead Viewers */}
            {currentUserViewers.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Viewing Leads</h4>
                {currentUserViewers.map(viewer => (
                  <div key={`${viewer.leadId}-${viewer.user.id}`} className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                      👁️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 truncate">
                        {viewer.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Lead {viewer.leadId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? 'Hide' : 'Show'} details
        </button>
      </div>
    </div>
  );
}
