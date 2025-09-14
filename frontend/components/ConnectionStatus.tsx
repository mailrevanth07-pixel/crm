import React, { useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface ConnectionStatusProps {
  className?: string;
}

export default function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const { isConnected, connectionStatus, reconnect } = useSocket();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Online';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Offline';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusDescription = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to server';
      case 'connecting':
        return 'Attempting to connect...';
      case 'disconnected':
        return 'No connection to server';
      case 'error':
        return 'Connection failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Status indicator */}
      <div 
        className="flex items-center p-3 rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-3 flex-shrink-0`}></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">
            {getStatusText()}
          </p>
          <p className="text-xs text-gray-500">
            Show details
          </p>
        </div>
      </div>

      {/* Details popup */}
      {showDetails && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2`}></div>
                <h3 className="text-sm font-medium text-gray-700">
                  {getStatusText()}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {getStatusDescription()}
              </p>
              
              {connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reconnect();
                    setShowDetails(false);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Try reconnecting
                </button>
              ) : null}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
