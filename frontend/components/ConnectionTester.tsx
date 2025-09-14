import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';

export default function ConnectionTester() {
  const { socket, isConnected, connectionStatus, reconnect } = useSocket();
  const { isAuthenticated, user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    addLog('ConnectionTester initialized');
    addLog(`Auth: ${isAuthenticated ? 'Yes' : 'No'}`);
    addLog(`User: ${user?.email || 'None'}`);
    addLog(`Socket: ${socket ? 'Initialized' : 'Not initialized'}`);
    addLog(`Connected: ${isConnected ? 'Yes' : 'No'}`);
    addLog(`Status: ${connectionStatus}`);
  }, [socket, isConnected, connectionStatus, isAuthenticated, user]);

  const testConnection = () => {
    addLog('Testing connection...');
    
    if (!socket) {
      addLog('ERROR: No socket available');
      return;
    }

    // Test basic connection
    const testData = {
      timestamp: Date.now(),
      test: 'connection_test',
      userAgent: navigator.userAgent
    };

    socket.emit('test_connection', testData);
    addLog('Emitted test_connection event');

    // Listen for response
    const responseHandler = (data: any) => {
      addLog(`Received response: ${JSON.stringify(data)}`);
      setTestResults(prev => ({ ...prev, connectionTest: data }));
      socket.off('test_response', responseHandler);
    };

    socket.on('test_response', responseHandler);

    // Timeout after 10 seconds
    setTimeout(() => {
      socket.off('test_response', responseHandler);
      addLog('Test timeout - no response received');
    }, 10000);
  };

  const testPing = () => {
    if (!socket) {
      addLog('ERROR: No socket available for ping test');
      return;
    }

    addLog('Sending ping...');
    const startTime = Date.now();
    
    socket.emit('ping');
    
    socket.once('pong', () => {
      const latency = Date.now() - startTime;
      addLog(`Pong received - latency: ${latency}ms`);
      setTestResults(prev => ({ ...prev, pingLatency: latency }));
    });
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-4 max-w-md max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-800">Connection Tester</h3>
        <button
          onClick={clearLogs}
          className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
        >
          Clear
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="text-xs">
          <span className="font-medium">Status:</span> 
          <span className={`ml-1 px-2 py-1 rounded text-white text-xs ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {connectionStatus}
          </span>
        </div>
        <div className="text-xs">
          <span className="font-medium">Transport:</span> 
          <span className="ml-1">{socket?.io?.engine?.transport?.name || 'Unknown'}</span>
        </div>
        <div className="text-xs">
          <span className="font-medium">Socket ID:</span> 
          <span className="ml-1">{socket?.id || 'None'}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={testConnection}
          className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          Test Connection
        </button>
        <button
          onClick={testPing}
          className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
        >
          Test Ping
        </button>
        <button
          onClick={reconnect}
          className="w-full px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
        >
          Force Reconnect
        </button>
      </div>

      <div className="text-xs">
        <div className="font-medium mb-1">Test Results:</div>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>

      <div className="text-xs mt-2">
        <div className="font-medium mb-1">Logs:</div>
        <div className="bg-black text-green-400 p-2 rounded max-h-32 overflow-y-auto font-mono">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
