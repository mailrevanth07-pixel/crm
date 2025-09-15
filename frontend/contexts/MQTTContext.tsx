import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { useAuth } from './AuthContext';

interface MQTTMessage {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
  leadId?: string;
  activityId?: string;
}

interface MQTTContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  publish: (topic: string, message: any, qos?: 0 | 1 | 2) => void;
  subscribe: (topic: string, callback: (message: MQTTMessage) => void) => void;
  unsubscribe: (topic: string) => void;
  lastMessage: MQTTMessage | null;
}

const MQTTContext = createContext<MQTTContextType | undefined>(undefined);

interface MQTTProviderProps {
  children: React.ReactNode;
}

export const MQTTProvider: React.FC<MQTTProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<MQTTMessage | null>(null);
  
  const clientRef = useRef<MqttClient | null>(null);
  const subscriptionsRef = useRef<Map<string, (message: MQTTMessage) => void>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      return;
    }

    if (!isAuthenticated || !user) {
      console.log('MQTT: Not authenticated, skipping connection');
      return;
    }

    setConnectionStatus('connecting');
    console.log('MQTT: Connecting to broker...');

    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL || 'ws://localhost:9001';
    const clientId = `crm-frontend-${user.id}-${Date.now()}`;

    const client = mqtt.connect(brokerUrl, {
      clientId,
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      clean: true,
      will: {
        topic: `crm/users/${user.id}/presence`,
        payload: JSON.stringify({
          type: 'offline',
          data: { userId: user.id, status: 'offline' },
          timestamp: new Date().toISOString(),
          userId: user.id
        }),
        qos: 1,
        retain: true
      }
    });

    client.on('connect', () => {
      console.log('MQTT: Connected successfully');
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;

      // Publish online status
      publish(`crm/users/${user.id}/presence`, {
        type: 'online',
        data: { 
          userId: user.id, 
          user: user, 
          status: 'online',
          lastSeen: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        userId: user.id
      }, 1, true);

      // Subscribe to user-specific topics
      subscribe(`crm/users/${user.id}/notifications`, (message) => {
        console.log('MQTT: User notification received', message);
        setLastMessage(message);
      });

      subscribe(`crm/users/${user.id}/presence`, (message) => {
        console.log('MQTT: User presence update received', message);
        setLastMessage(message);
      });

      // Subscribe to global topics
      subscribe('crm/leads/+/created', (message) => {
        console.log('MQTT: Lead created received', message);
        setLastMessage(message);
      });

      subscribe('crm/leads/+/updated', (message) => {
        console.log('MQTT: Lead updated received', message);
        setLastMessage(message);
      });

      subscribe('crm/leads/+/assigned', (message) => {
        console.log('MQTT: Lead assigned received', message);
        setLastMessage(message);
      });

      subscribe('crm/activities/+/created', (message) => {
        console.log('MQTT: Activity created received', message);
        setLastMessage(message);
      });

      subscribe('crm/notifications/+', (message) => {
        console.log('MQTT: Notification received', message);
        setLastMessage(message);
      });
    });

    client.on('error', (error) => {
      console.error('MQTT: Connection error', error);
      setConnectionStatus('error');
      setIsConnected(false);
    });

    client.on('close', () => {
      console.log('MQTT: Connection closed');
      setConnectionStatus('disconnected');
      setIsConnected(false);
    });

    client.on('reconnect', () => {
      reconnectAttemptsRef.current++;
      console.log(`MQTT: Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
      setConnectionStatus('connecting');
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('MQTT: Max reconnection attempts reached');
        setConnectionStatus('error');
        client.end();
      }
    });

    client.on('offline', () => {
      console.log('MQTT: Client went offline');
      setConnectionStatus('disconnected');
      setIsConnected(false);
    });

    client.on('message', (topic, message) => {
      try {
        const parsedMessage: MQTTMessage = JSON.parse(message.toString());
        console.log('MQTT: Message received', { topic, message: parsedMessage });
        
        // Call registered callbacks for this topic
        subscriptionsRef.current.forEach((callback, subscribedTopic) => {
          if (topicMatches(subscribedTopic, topic)) {
            callback(parsedMessage);
          }
        });
        
        setLastMessage(parsedMessage);
      } catch (error) {
        console.error('MQTT: Error parsing message', { topic, error });
      }
    });

    clientRef.current = client;
  }, [isAuthenticated, user]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      console.log('MQTT: Disconnecting...');
      
      // Publish offline status
      if (user) {
        publish(`crm/users/${user.id}/presence`, {
          type: 'offline',
          data: { userId: user.id, status: 'offline' },
          timestamp: new Date().toISOString(),
          userId: user.id
        }, 1, true);
      }

      clientRef.current.end();
      clientRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
      subscriptionsRef.current.clear();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [user]);

  const publish = useCallback((topic: string, message: any, qos: 0 | 1 | 2 = 1, retain: boolean = false) => {
    if (!clientRef.current || !isConnected) {
      console.warn('MQTT: Client not connected, cannot publish', { topic });
      return;
    }

    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    clientRef.current.publish(topic, messageStr, { qos, retain }, (error) => {
      if (error) {
        console.error('MQTT: Publish error', { topic, error });
      } else {
        console.log('MQTT: Message published', { topic, qos, retain });
      }
    });
  }, [isConnected]);

  const subscribe = useCallback((topic: string, callback: (message: MQTTMessage) => void) => {
    if (!clientRef.current || !isConnected) {
      console.warn('MQTT: Client not connected, cannot subscribe', { topic });
      return;
    }

    clientRef.current.subscribe(topic, { qos: 1 }, (error) => {
      if (error) {
        console.error('MQTT: Subscribe error', { topic, error });
      } else {
        console.log('MQTT: Subscribed to topic', { topic });
        subscriptionsRef.current.set(topic, callback);
      }
    });
  }, [isConnected]);

  const unsubscribe = useCallback((topic: string) => {
    if (!clientRef.current || !isConnected) {
      console.warn('MQTT: Client not connected, cannot unsubscribe', { topic });
      return;
    }

    clientRef.current.unsubscribe(topic, (error) => {
      if (error) {
        console.error('MQTT: Unsubscribe error', { topic, error });
      } else {
        console.log('MQTT: Unsubscribed from topic', { topic });
        subscriptionsRef.current.delete(topic);
      }
    });
  }, [isConnected]);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  // Handle page visibility changes for mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce activity
        console.log('MQTT: Page hidden, reducing activity');
      } else {
        // Page is visible, ensure connection
        if (isAuthenticated && user && !isConnected) {
          console.log('MQTT: Page visible, reconnecting...');
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, user, isConnected, connect]);

  const contextValue: MQTTContextType = {
    isConnected,
    connectionStatus,
    publish,
    subscribe,
    unsubscribe,
    lastMessage
  };

  return (
    <MQTTContext.Provider value={contextValue}>
      {children}
    </MQTTContext.Provider>
  );
};

export const useMQTT = (): MQTTContextType => {
  const context = useContext(MQTTContext);
  if (context === undefined) {
    throw new Error('useMQTT must be used within an MQTTProvider');
  }
  return context;
};

// Helper function to match MQTT topics with wildcards
function topicMatches(subscribedTopic: string, receivedTopic: string): boolean {
  if (subscribedTopic === receivedTopic) {
    return true;
  }

  // Handle + wildcard (single level)
  const subscribedParts = subscribedTopic.split('/');
  const receivedParts = receivedTopic.split('/');

  if (subscribedParts.length !== receivedParts.length) {
    return false;
  }

  for (let i = 0; i < subscribedParts.length; i++) {
    if (subscribedParts[i] !== '+' && subscribedParts[i] !== receivedParts[i]) {
      return false;
    }
  }

  return true;
}
