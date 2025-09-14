import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface MobileConnectionStatusProps {
  className?: string;
}

export default function MobileConnectionStatus({ className = '' }: MobileConnectionStatusProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { socket, isConnected, connectionStatus } = useSocket();

  useEffect(() => {
    // Detect if running on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };

    setIsMobile(checkMobile());
  }, []);

  if (!isMobile) return null;

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Online';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Offline';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getConnectionDetails = () => {
    if (!socket) return 'Socket not initialized';
    
    const transport = socket.io.engine?.transport?.name || 'unknown';
    const readyState = socket.io.engine?.readyState || 'unknown';
    
    return `Transport: ${transport} | State: ${readyState}`;
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Connection Status Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg text-white text-sm font-medium transition-all duration-200 ${getStatusColor()}`}
      >
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white' : 'bg-gray-300'}`}></div>
        <span>{getStatusText()}</span>
        <span className="text-xs opacity-75">
          {showDetails ? '▲' : '▼'}
        </span>
      </button>

      {/* Connection Details */}
      {showDetails && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border p-3 min-w-64 max-w-80">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Connection Details</div>
            <div className="text-xs text-gray-600">
              Status: <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {getStatusText()}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {getConnectionDetails()}
            </div>
            <div className="text-xs text-gray-600">
              Socket ID: {socket?.id || 'Not connected'}
            </div>
            <div className="text-xs text-gray-600">
              Mobile: {isMobile ? 'Yes' : 'No'}
            </div>
            
            {/* Reconnect Button */}
            {!isConnected && (
              <button
                onClick={() => {
                  if (socket) {
                    socket.connect();
                  }
                }}
                className="w-full mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
