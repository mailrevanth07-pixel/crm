import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

interface SocketDebugInfoProps {
  className?: string;
}

export default function SocketDebugInfo({ className = '' }: SocketDebugInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const { socket, isConnected, connectionStatus } = useSocket();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Add debug logs
    const addLog = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setDebugLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    };

    // Log authentication status
    addLog(`Auth: ${isAuthenticated ? 'Yes' : 'No'}`);
    addLog(`User: ${user?.email || 'None'}`);
    
    // Log socket status
    if (socket) {
      const status = socket.getConnectionStatus();
      addLog(`Socket: Initialized`);
      addLog(`Socket ID: ${status.socketId || 'None'}`);
      addLog(`Connected: ${status.connected ? 'Yes' : 'No'}`);
      addLog(`Transport: ${status.transport || 'Unknown'}`);
      addLog(`Queue: ${status.queueLength} items`);
    } else {
      addLog(`Socket: Not initialized`);
    }
    
    addLog(`Status: ${connectionStatus}`);
  }, [socket, isConnected, connectionStatus, isAuthenticated, user]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className={`fixed top-4 left-4 z-50 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-black text-white text-xs px-2 py-1 rounded"
      >
        Debug {isExpanded ? '▼' : '▶'}
      </button>
      
      {isExpanded && (
        <div className="mt-2 bg-black text-white text-xs p-2 rounded max-w-xs max-h-64 overflow-y-auto">
          <div className="space-y-1">
            {debugLogs.map((log, index) => (
              <div key={index} className="text-green-400 font-mono">
                {log}
              </div>
            ))}
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-yellow-400">
              Environment: {process.env.NODE_ENV}
            </div>
            <div className="text-yellow-400">
              API URL: {process.env.NEXT_PUBLIC_API_URL || 'Default'}
            </div>
            <div className="text-yellow-400">
              User Agent: {navigator.userAgent.slice(0, 50)}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
