import React, { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import SocketStatus from './SocketStatus';

interface WebSocketDashboardProps {
  className?: string;
}

export default function WebSocketDashboard({ className = '' }: WebSocketDashboardProps) {
  const { socket, isConnected, connectionStatus } = useSocket();
  const [healthData, setHealthData] = useState<any>(null);
  const [connectionHistory, setConnectionHistory] = useState<any[]>([]);
  const [eventLog, setEventLog] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleHealthStatus = (data: any) => {
      setHealthData(data);
      setConnectionHistory(prev => [
        ...prev.slice(-9), // Keep last 10 entries
        { ...data, timestamp: new Date().toISOString() }
      ]);
    };

    const handleLeadCreated = (data: any) => {
      addEventLog('lead:created', `Lead created: ${data.lead.title}`, data);
    };

    const handleLeadUpdated = (data: any) => {
      addEventLog('lead:updated', `Lead updated: ${data.lead.title}`, data);
    };

    const handleLeadDeleted = (data: any) => {
      addEventLog('lead:deleted', `Lead deleted: ${data.leadId}`, data);
    };

    const handleActivityCreated = (data: any) => {
      addEventLog('activity:created', `Activity created: ${data.activity.type}`, data);
    };

    const handleMaintenance = (data: any) => {
      addEventLog('maintenance:notice', data.message, data);
    };

    const addEventLog = (event: string, message: string, data: any) => {
      setEventLog(prev => [
        { event, message, data, timestamp: new Date().toISOString() },
        ...prev.slice(0, 19) // Keep last 20 events
      ]);
    };

    socket.on('health:status', handleHealthStatus);
    socket.on('lead:created', handleLeadCreated);
    socket.on('lead:updated', handleLeadUpdated);
    socket.on('lead:deleted', handleLeadDeleted);
    socket.on('activity:created', handleActivityCreated);
    socket.on('maintenance:notice', handleMaintenance);

    return () => {
      socket.off('health:status', handleHealthStatus);
      socket.off('lead:created', handleLeadCreated);
      socket.off('lead:updated', handleLeadUpdated);
      socket.off('lead:deleted', handleLeadDeleted);
      socket.off('activity:created', handleActivityCreated);
      socket.off('maintenance:notice', handleMaintenance);
    };
  }, [socket]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">WebSocket Dashboard</h2>
        <SocketStatus showDetails={false} />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Connection Status</h3>
            <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
              {connectionStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Socket ID: {socket?.id || 'N/A'}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Connected Users</h3>
            <span className="text-lg font-semibold text-blue-600">
              {healthData?.connectedSockets || 0}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Organization users: {healthData?.orgUsers || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Last Update</h3>
            <span className="text-sm text-gray-600">
              {healthData?.timestamp ? formatTimestamp(healthData.timestamp) : 'Never'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time monitoring active
          </p>
        </div>
      </div>

      {/* Connection History Chart */}
      {connectionHistory.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Connection History</h3>
          <div className="h-32 flex items-end space-x-1">
            {connectionHistory.map((entry, index) => (
              <div
                key={index}
                className="bg-blue-500 rounded-t"
                style={{
                  height: `${(entry.connectedSockets / Math.max(...connectionHistory.map(h => h.connectedSockets))) * 100}%`,
                  width: `${100 / connectionHistory.length}%`
                }}
                title={`${entry.connectedSockets} users at ${formatTimestamp(entry.timestamp)}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>10 minutes ago</span>
            <span>Now</span>
          </div>
        </div>
      )}

      {/* Event Log */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Real-time Event Log</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {eventLog.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No events yet</p>
          ) : (
            eventLog.map((log, index) => (
              <div key={index} className="flex items-start space-x-3 text-xs">
                <span className="text-gray-400 font-mono">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className="text-blue-600 font-medium">
                  {log.event}
                </span>
                <span className="text-gray-700">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detailed Status */}
      <SocketStatus showDetails={true} />
    </div>
  );
}
