/**
 * Hybrid Real-time Service
 * Combines Socket.IO and MQTT for maximum reliability across all platforms
 */

import { EventEmitter } from 'events';
import { useMQTT } from '../contexts/MQTTContext';

interface HybridRealtimeConfig {
  apiUrl: string;
  token: string;
  pollInterval: number;
  retryAttempts: number;
  retryDelay: number;
  useMQTT: boolean;
  useSocketIO: boolean;
  usePolling: boolean;
}

interface HybridRealtimeCallbacks {
  onNotification?: (data: any) => void;
  onActivity?: (data: any) => void;
  onPresence?: (data: any) => void;
  onLead?: (data: any) => void;
  onError?: (error: any) => void;
  onStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void;
}

class HybridRealtimeService {
  private config: HybridRealtimeConfig;
  private callbacks: HybridRealtimeCallbacks = {};
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private retryCount = 0;
  private lastPollTime = 0;
  private abortController: AbortController | null = null;
  private eventEmitter = new EventEmitter();
  private mqttService: any = null;
  private socketIOService: any = null;

  constructor(config: HybridRealtimeConfig) {
    this.config = config;
  }

  public setCallbacks(callbacks: HybridRealtimeCallbacks) {
    this.callbacks = callbacks;
  }

  public setMQTTService(mqttService: any) {
    this.mqttService = mqttService;
  }

  public setSocketIOService(socketIOService: any) {
    this.socketIOService = socketIOService;
  }

  public start() {
    console.log('HybridRealtimeService: Starting hybrid realtime service', {
      useMQTT: this.config.useMQTT,
      useSocketIO: this.config.useSocketIO,
      usePolling: this.config.usePolling,
      isBrowser: typeof window !== 'undefined'
    });

    if (typeof window === 'undefined') {
      console.log('HybridRealtimeService: Not in browser environment, skipping start');
      return;
    }

    if (this.isRunning) {
      console.log('HybridRealtimeService: Already running, stopping first');
      this.stop();
    }

    this.isRunning = true;
    this.retryCount = 0;
    
    // Start MQTT if available and enabled
    if (this.config.useMQTT && this.mqttService) {
      this.setupMQTTListeners();
    }

    // Start Socket.IO if available and enabled
    if (this.config.useSocketIO && this.socketIOService) {
      this.setupSocketIOListeners();
    }

    // Start polling as fallback if enabled
    if (this.config.usePolling) {
      this.startPolling();
    }

    this.callbacks.onStatusChange?.('connected');
  }

  public stop() {
    console.log('HybridRealtimeService: Stopping hybrid realtime service');
    this.isRunning = false;
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Clean up MQTT listeners
    if (this.mqttService) {
      this.cleanupMQTTListeners();
    }

    // Clean up Socket.IO listeners
    if (this.socketIOService) {
      this.cleanupSocketIOListeners();
    }

    this.callbacks.onStatusChange?.('disconnected');
  }

  private setupMQTTListeners() {
    if (!this.mqttService) return;

    console.log('HybridRealtimeService: Setting up MQTT listeners');

    // Subscribe to lead events
    this.mqttService.subscribe('crm/leads/+/created', (message: any) => {
      this.handleLeadEvent('lead:created', message);
    });

    this.mqttService.subscribe('crm/leads/+/updated', (message: any) => {
      this.handleLeadEvent('lead:updated', message);
    });

    this.mqttService.subscribe('crm/leads/+/assigned', (message: any) => {
      this.handleLeadEvent('lead:assigned', message);
    });

    // Subscribe to activity events
    this.mqttService.subscribe('crm/activities/+/created', (message: any) => {
      this.handleActivityEvent('activity:created', message);
    });

    // Subscribe to presence events
    this.mqttService.subscribe('crm/users/+/presence', (message: any) => {
      this.handlePresenceEvent('user:presence', message);
    });

    // Subscribe to notifications
    this.mqttService.subscribe('crm/notifications/+', (message: any) => {
      this.handleNotificationEvent('notification', message);
    });
  }

  private setupSocketIOListeners() {
    if (!this.socketIOService) return;

    console.log('HybridRealtimeService: Setting up Socket.IO listeners');

    // Lead events
    this.socketIOService.on('lead:created', (data: any) => {
      this.handleLeadEvent('lead:created', data);
    });

    this.socketIOService.on('lead:updated', (data: any) => {
      this.handleLeadEvent('lead:updated', data);
    });

    this.socketIOService.on('lead:assigned', (data: any) => {
      this.handleLeadEvent('lead:assigned', data);
    });

    // Activity events
    this.socketIOService.on('activity:created', (data: any) => {
      this.handleActivityEvent('activity:created', data);
    });

    // Presence events
    this.socketIOService.on('user:online', (data: any) => {
      this.handlePresenceEvent('user:online', data);
    });

    this.socketIOService.on('user:offline', (data: any) => {
      this.handlePresenceEvent('user:offline', data);
    });

    // Connection events
    this.socketIOService.on('connected', () => {
      console.log('HybridRealtimeService: Socket.IO connected');
      this.callbacks.onStatusChange?.('connected');
    });

    this.socketIOService.on('disconnected', () => {
      console.log('HybridRealtimeService: Socket.IO disconnected');
      this.callbacks.onStatusChange?.('disconnected');
    });

    this.socketIOService.on('error', (error: any) => {
      console.error('HybridRealtimeService: Socket.IO error', error);
      this.callbacks.onError?.(error);
    });
  }

  private cleanupMQTTListeners() {
    if (!this.mqttService) return;

    console.log('HybridRealtimeService: Cleaning up MQTT listeners');
    
    this.mqttService.unsubscribe('crm/leads/+/created');
    this.mqttService.unsubscribe('crm/leads/+/updated');
    this.mqttService.unsubscribe('crm/leads/+/assigned');
    this.mqttService.unsubscribe('crm/activities/+/created');
    this.mqttService.unsubscribe('crm/users/+/presence');
    this.mqttService.unsubscribe('crm/notifications/+');
  }

  private cleanupSocketIOListeners() {
    if (!this.socketIOService) return;

    console.log('HybridRealtimeService: Cleaning up Socket.IO listeners');
    
    this.socketIOService.off('lead:created');
    this.socketIOService.off('lead:updated');
    this.socketIOService.off('lead:assigned');
    this.socketIOService.off('activity:created');
    this.socketIOService.off('user:online');
    this.socketIOService.off('user:offline');
    this.socketIOService.off('connected');
    this.socketIOService.off('disconnected');
    this.socketIOService.off('error');
  }

  private startPolling() {
    if (!this.isRunning) return;

    console.log('HybridRealtimeService: Starting polling fallback', {
      pollInterval: this.config.pollInterval
    });

    this.pollInterval = setInterval(() => {
      this.pollForUpdates();
    }, this.config.pollInterval);
  }

  private async pollForUpdates() {
    if (!this.isRunning) return;

    try {
      this.abortController = new AbortController();
      
      const response = await fetch(`${this.config.apiUrl}/api/realtime/poll`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.handlePollResponse(data);
      this.retryCount = 0;

    } catch (error: any) {
      console.error('HybridRealtimeService: Polling error', error);
      this.handlePollError(error);
    }
  }

  private handlePollResponse(data: any) {
    this.lastPollTime = Date.now();

    // Handle notifications
    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach((notification: any) => {
        if (!notification.read) {
          this.handleNotificationEvent('notification', notification);
        }
      });
    }

    // Handle activities
    if (data.activities && data.activities.length > 0) {
      data.activities.forEach((activity: any) => {
        this.handleActivityEvent('activity:created', activity);
      });
    }

    // Handle presence
    if (data.presence) {
      this.handlePresenceEvent('user:presence', data.presence);
    }
  }

  private handlePollError(error: any) {
    this.retryCount++;
    
    if (this.retryCount >= this.config.retryAttempts) {
      console.error('HybridRealtimeService: Max retries reached, stopping polling');
      this.callbacks.onError?.(error);
      this.callbacks.onStatusChange?.('error');
      this.stop();
      return;
    }

    const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1);
    console.log(`HybridRealtimeService: Retrying in ${delay}ms (attempt ${this.retryCount})`);
    
    setTimeout(() => {
      if (this.isRunning) {
        this.pollForUpdates();
      }
    }, delay);
  }

  private handleLeadEvent(eventType: string, data: any) {
    console.log('HybridRealtimeService: Handling lead event', { eventType, data });
    
    // Convert to notification format for display
    const notification = {
      type: 'info',
      title: this.getLeadEventTitle(eventType),
      message: this.getLeadEventMessage(eventType, data),
      data,
      timestamp: new Date().toISOString()
    };

    this.callbacks.onNotification?.(notification);
    this.callbacks.onLead?.(data);
  }

  private handleActivityEvent(eventType: string, data: any) {
    console.log('HybridRealtimeService: Handling activity event', { eventType, data });
    
    const notification = {
      type: 'info',
      title: 'New Activity',
      message: `${data.createdBy?.name || 'Someone'} created a new activity`,
      data,
      timestamp: new Date().toISOString()
    };

    this.callbacks.onNotification?.(notification);
    this.callbacks.onActivity?.(data);
  }

  private handlePresenceEvent(eventType: string, data: any) {
    console.log('HybridRealtimeService: Handling presence event', { eventType, data });
    this.callbacks.onPresence?.(data);
  }

  private handleNotificationEvent(eventType: string, data: any) {
    console.log('HybridRealtimeService: Handling notification event', { eventType, data });
    this.callbacks.onNotification?.(data);
  }

  private getLeadEventTitle(eventType: string): string {
    switch (eventType) {
      case 'lead:created':
        return 'New Lead Created';
      case 'lead:updated':
        return 'Lead Updated';
      case 'lead:assigned':
        return 'Lead Assigned';
      default:
        return 'Lead Update';
    }
  }

  private getLeadEventMessage(eventType: string, data: any): string {
    switch (eventType) {
      case 'lead:created':
        return `${data.createdBy?.name || 'Someone'} created a new lead: ${data.lead?.company || 'Unknown Company'}`;
      case 'lead:updated':
        return `${data.updatedBy?.name || 'Someone'} updated lead: ${data.lead?.company || 'Unknown Company'}`;
      case 'lead:assigned':
        return `${data.assignedBy?.name || 'Someone'} assigned lead ${data.lead?.company || 'Unknown Company'} to ${data.lead?.owner?.name || 'someone'}`;
      default:
        return 'Lead has been updated';
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      retryCount: this.retryCount,
      lastPollTime: this.lastPollTime,
      timeSinceLastPoll: this.lastPollTime ? Date.now() - this.lastPollTime : null,
      mqttConnected: this.mqttService?.isConnected || false,
      socketIOConnected: this.socketIOService?.connected || false
    };
  }
}

export default HybridRealtimeService;
