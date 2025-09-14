import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  activitiesToday: number;
  onlineUsers: number;
  lastUpdated: string;
}


export default function RealtimeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newLeadsToday: 0,
    activitiesToday: 0,
    onlineUsers: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLive, setIsLive] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle real-time stats updates
    const handleStatsUpdate = (data: any) => {
      setStats(prev => ({
        ...prev,
        ...data,
        lastUpdated: new Date().toISOString()
      }));
    };

    // Handle lead events
    const handleLeadCreated = (data: any) => {
      setStats(prev => ({
        ...prev,
        totalLeads: prev.totalLeads + 1,
        newLeadsToday: prev.newLeadsToday + 1,
        lastUpdated: new Date().toISOString()
      }));

    };

    const handleLeadUpdated = (data: any) => {
      setStats(prev => ({
        ...prev,
        lastUpdated: new Date().toISOString()
      }));

    };

    // Handle activity events
    const handleActivityCreated = (data: any) => {
      setStats(prev => ({
        ...prev,
        activitiesToday: prev.activitiesToday + 1,
        lastUpdated: new Date().toISOString()
      }));

    };

    // Handle health status
    const handleHealthStatus = (data: any) => {
      setStats(prev => ({
        ...prev,
        onlineUsers: data.orgUsers || 0,
        lastUpdated: new Date().toISOString()
      }));
    };

    // Register event listeners
    socket.on('stats:update', handleStatsUpdate);
    socket.on('lead:created', handleLeadCreated);
    socket.on('lead:updated', handleLeadUpdated);
    socket.on('activity:created', handleActivityCreated);
    socket.on('health:status', handleHealthStatus);

    // Cleanup
    return () => {
      socket.off('stats:update', handleStatsUpdate);
      socket.off('lead:created', handleLeadCreated);
      socket.off('lead:updated', handleLeadUpdated);
      socket.off('activity:created', handleActivityCreated);
      socket.off('health:status', handleHealthStatus);
    };
  }, [socket, isConnected]);


  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };


  return (
    <div className="bg-white rounded-lg shadow-lg border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-gray-900">Live Dashboard</h2>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {formatTime(stats.lastUpdated)}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Leads</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalLeads}</p>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">New Today</p>
              <p className="text-2xl font-bold text-green-900">{stats.newLeadsToday}</p>
            </div>
            <div className="text-2xl">🆕</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Activities Today</p>
              <p className="text-2xl font-bold text-purple-900">{stats.activitiesToday}</p>
            </div>
            <div className="text-2xl">📝</div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Online Users</p>
              <p className="text-2xl font-bold text-orange-900">{stats.onlineUsers}</p>
            </div>
            <div className="text-2xl">👤</div>
          </div>
        </div>
      </div>


      {/* Connection Status */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected to real-time updates' : 'Disconnected'}
            </span>
          </div>
          {!isConnected && (
            <button className="text-sm text-primary-600 hover:text-primary-800">
              Reconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
