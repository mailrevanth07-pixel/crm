import mqtt, { MqttClient } from 'mqtt';
import logger from './logger';

export interface MQTTConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId: string;
  keepalive: number;
  reconnectPeriod: number;
  connectTimeout: number;
  clean: boolean;
  qos: 0 | 1 | 2;
}

export class MQTTService {
  private client: MqttClient | null = null;
  private config: MQTTConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    this.config = {
      brokerUrl: process.env.MQTT_BROKER_URL || 'ws://localhost:9001',
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: `crm-backend-${Date.now()}`,
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      clean: true,
      qos: 1
    };
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client && this.isConnected) {
        logger.info('MQTT client already connected');
        resolve();
        return;
      }

      logger.info('Connecting to MQTT broker', { 
        brokerUrl: this.config.brokerUrl,
        clientId: this.config.clientId 
      });

      this.client = mqtt.connect(this.config.brokerUrl, {
        username: this.config.username,
        password: this.config.password,
        clientId: this.config.clientId,
        keepalive: this.config.keepalive,
        reconnectPeriod: this.config.reconnectPeriod,
        connectTimeout: this.config.connectTimeout,
        clean: this.config.clean,
        will: {
          topic: 'crm/system/backend/status',
          payload: JSON.stringify({ 
            status: 'offline', 
            timestamp: new Date().toISOString(),
            clientId: this.config.clientId
          }),
          qos: 1,
          retain: true
        }
      });

      this.client.on('connect', () => {
        logger.info('MQTT client connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Publish online status
        this.publish('crm/system/backend/status', {
          status: 'online',
          timestamp: new Date().toISOString(),
          clientId: this.config.clientId
        }, 1, true);

        resolve();
      });

      this.client.on('error', (error) => {
        logger.error('MQTT client error', error);
        this.isConnected = false;
        reject(error);
      });

      this.client.on('close', () => {
        logger.warn('MQTT client connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        logger.info('MQTT client reconnecting', { 
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts 
        });
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('MQTT client max reconnection attempts reached');
          this.disconnect();
        }
      });

      this.client.on('offline', () => {
        logger.warn('MQTT client went offline');
        this.isConnected = false;
      });
    });
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      logger.info('Disconnecting MQTT client');
      
      // Publish offline status
      this.publish('crm/system/backend/status', {
        status: 'offline',
        timestamp: new Date().toISOString(),
        clientId: this.config.clientId
      }, 1, true);

      this.client.end();
      this.client = null;
      this.isConnected = false;
    }
  }

  public publish(topic: string, payload: any, qos: 0 | 1 | 2 = 1, retain: boolean = false): void {
    if (!this.client || !this.isConnected) {
      logger.warn('MQTT client not connected, cannot publish', { topic });
      return;
    }

    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    this.client.publish(topic, message, { qos, retain }, (error) => {
      if (error) {
        logger.error('MQTT publish error', { topic, error });
      } else {
        logger.debug('MQTT message published', { topic, qos, retain });
      }
    });
  }

  public subscribe(topic: string, callback: (topic: string, message: Buffer) => void): void {
    if (!this.client || !this.isConnected) {
      logger.warn('MQTT client not connected, cannot subscribe', { topic });
      return;
    }

    this.client.subscribe(topic, { qos: this.config.qos }, (error) => {
      if (error) {
        logger.error('MQTT subscribe error', { topic, error });
      } else {
        logger.info('MQTT subscribed to topic', { topic });
      }
    });

    this.client.on('message', (receivedTopic, message) => {
      if (this.topicMatches(topic, receivedTopic)) {
        callback(receivedTopic, message);
      }
    });
  }

  public unsubscribe(topic: string): void {
    if (!this.client || !this.isConnected) {
      logger.warn('MQTT client not connected, cannot unsubscribe', { topic });
      return;
    }

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        logger.error('MQTT unsubscribe error', { topic, error });
      } else {
        logger.info('MQTT unsubscribed from topic', { topic });
      }
    });
  }

  private topicMatches(subscribedTopic: string, receivedTopic: string): boolean {
    // Simple wildcard matching for MQTT topics
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

  public isClientConnected(): boolean {
    return this.isConnected;
  }

  public getClientId(): string {
    return this.config.clientId;
  }
}

// Export singleton instance
export const mqttService = new MQTTService();
