import React, { useState, useEffect } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useAuth } from '@/hooks/useAuth';

interface MobileRealtimeStatusProps {
  className?: string;
}

export default function MobileRealtimeStatus({ className = '' }: MobileRealtimeStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isConnected, connectionStatus, getStatus, startRealtime, stopRealtime } = useRealtime();
  const { isAuthenticated, user } = useAuth();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Detect if running on mobile (client-side only)
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Online';
      case 'disconnected': return 'Offline';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const status = getStatus();

  // Don't render during SSR
  if (!isClient) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      {/* Status Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg text-white text-sm font-medium transition-all duration-200 ${getStatusColor()}`}
      >
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white' : 'bg-gray-300'}`}></div>
        <span>{getStatusText()}</span>
        <span className="text-xs opacity-75">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Status Details */}
      {isExpanded && (
        <div className="absolute bottom-16 left-0 bg-white rounded-lg shadow-lg border p-3 min-w-64 max-w-80">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Polling Status</div>
            <div className="text-xs text-gray-600">
              Status: <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {getStatusText()}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Running: {status.isRunning ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-600">
              Retry Count: {status.retryCount}
            </div>
            <div className="text-xs text-gray-600">
              Last Poll: {status.lastPollTime ? new Date(status.lastPollTime).toLocaleTimeString() : 'Never'}
            </div>
            <div className="text-xs text-gray-600">
              Time Since Poll: {status.timeSinceLastPoll ? `${Math.round(status.timeSinceLastPoll / 1000)}s ago` : 'N/A'}
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
            
            {/* Control Buttons */}
            <div className="space-y-1 mt-2">
              {!isConnected ? (
                <button
                  onClick={startRealtime}
                  className="w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  Start Polling
                </button>
              ) : (
                <button
                  onClick={stopRealtime}
                  className="w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  Stop Polling
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="w-full px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
