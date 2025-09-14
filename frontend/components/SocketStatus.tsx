import React, { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface SocketStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function SocketStatus({ showDetails = false, className = '' }: SocketStatusProps) {
  const { socket, isConnected, connectionStatus, reconnect } = useSocket();
  const [healthData, setHealthData] = useState<any>(null);
  const [lastPing, setLastPing] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for health status updates
    const handleHealthStatus = (data: any) => {
      setHealthData(data);
    };

    // Listen for pong responses
    const handlePong = () => {
      setLastPing(Date.now());
    };

    // Listen for maintenance notices
    const handleMaintenance = (data: any) => {
      // You could show a toast notification here
    };

    socket.on('health:status', handleHealthStatus);
    socket.on('pong', handlePong);
    socket.on('maintenance:notice', handleMaintenance);

    // Send periodic ping to check connection health
    const pingInterval = setInterval(() => {
      if (socket && isConnected) {
        socket.emit('ping');
      }
    }, 10000); // Ping every 10 seconds

    return () => {
      socket.off('health:status', handleHealthStatus);
      socket.off('pong', handlePong);
      socket.off('maintenance:notice', handleMaintenance);
      clearInterval(pingInterval);
    };
  }, [socket, isConnected]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-100';
      case 'disconnected':
        return 'text-gray-600 bg-gray-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'disconnected':
        return '⚪';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const formatLastPing = () => {
    if (!lastPing) return 'Never';
    const now = Date.now();
    const diff = now - lastPing;
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {connectionStatus === 'error' && (
          <button
            onClick={reconnect}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">WebSocket Status</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm">{getStatusIcon()}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Socket ID:</span>
          <span className="font-mono">{socket?.id || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Last Ping:</span>
          <span>{formatLastPing()}</span>
        </div>

        {healthData && (
          <>
            <div className="flex justify-between">
              <span>Connected Users:</span>
              <span>{healthData.connectedSockets}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Org Users:</span>
              <span>{healthData.orgUsers}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span>{new Date(healthData.timestamp).toLocaleTimeString()}</span>
            </div>
          </>
        )}

        {connectionStatus === 'error' && (
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={reconnect}
              className="w-full text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Reconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
