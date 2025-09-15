import React from 'react';
import { useMQTT } from '../contexts/MQTTContext';
import { useHybridRealtime } from '../contexts/HybridRealtimeContext';

interface MQTTStatusProps {
  className?: string;
}

export default function MQTTStatus({ className = '' }: MQTTStatusProps) {
  const { isConnected: mqttConnected, connectionStatus: mqttStatus } = useMQTT();
  const { isMQTTConnected, isSocketIOConnected, connectionStatus } = useHybridRealtime();

  const getStatusColor = () => {
    if (mqttConnected || isMQTTConnected) return 'text-green-500';
    if (mqttStatus === 'connecting' || connectionStatus === 'connecting') return 'text-yellow-500';
    if (mqttStatus === 'error' || connectionStatus === 'error') return 'text-red-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (mqttConnected || isMQTTConnected) return 'MQTT Connected';
    if (mqttStatus === 'connecting' || connectionStatus === 'connecting') return 'MQTT Connecting...';
    if (mqttStatus === 'error' || connectionStatus === 'error') return 'MQTT Error';
    return 'MQTT Disconnected';
  };

  const getStatusIcon = () => {
    if (mqttConnected || isMQTTConnected) return '🟢';
    if (mqttStatus === 'connecting' || connectionStatus === 'connecting') return '🟡';
    if (mqttStatus === 'error' || connectionStatus === 'error') return '🔴';
    return '⚪';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm">{getStatusIcon()}</span>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      <div className="flex space-x-1 text-xs text-gray-500">
        <span className={isMQTTConnected ? 'text-green-500' : 'text-gray-400'}>
          MQTT
        </span>
        <span>•</span>
        <span className={isSocketIOConnected ? 'text-green-500' : 'text-gray-400'}>
          Socket.IO
        </span>
      </div>
    </div>
  );
}
