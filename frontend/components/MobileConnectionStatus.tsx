import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface MobileConnectionStatusProps {
  className?: string;
}

export default function MobileConnectionStatus({ className = '' }: MobileConnectionStatusProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { socket, isConnected, connectionStatus } = useSocket();
  const { isAuthenticated, user } = useAuth();

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
    if (!socket) return 'Socket not initialized - Check authentication';
    
    const transport = socket.io?.engine?.transport?.name || 'unknown';
    const connected = socket.connected || false;
    
    return `Transport: ${transport} | Connected: ${connected}`;
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
            <div className="text-xs text-gray-600">
              Auth: {isAuthenticated ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-600">
              User: {user?.email || 'None'}
            </div>
            <div className="text-xs text-gray-600">
              API URL: {process.env.NEXT_PUBLIC_API_URL || 'Default'}
            </div>
            <div className="text-xs text-gray-600">
              User Agent: {typeof window !== 'undefined' ? navigator.userAgent.slice(0, 30) : 'Unknown'}...
            </div>
            
            {/* Reconnect Button */}
            {!isConnected && (
              <div className="space-y-1 mt-2">
                <button
                  onClick={() => {
                    if (socket) {
                      socket.connect();
                    }
                  }}
                  className="w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  Connect
                </button>
                <button
                  onClick={() => {
                    // Force page reload to reinitialize everything
                    window.location.reload();
                  }}
                  className="w-full px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
