import { Server as SocketIOServer } from 'socket.io';
import { mqttService } from '../config/mqtt';
import logger from '../config/logger';
import { AuthenticatedSocket } from '../socket/socketHandler';

export interface MQTTMessage {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
  leadId?: string;
  activityId?: string;
}

export class MQTTBridge {
  private io: SocketIOServer;
  private isInitialized = false;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('MQTT Bridge already initialized');
      return;
    }

    try {
      // Connect to MQTT broker
      await mqttService.connect();
      
      // Subscribe to MQTT topics
      this.setupMQTTSubscriptions();
      
      this.isInitialized = true;
      logger.info('MQTT Bridge initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MQTT Bridge', error);
      throw error;
    }
  }

  private setupMQTTSubscriptions(): void {
    // Subscribe to lead-related topics
    mqttService.subscribe('crm/leads/+/created', (topic, message) => {
      this.handleLeadMessage('lead:created', topic, message);
    });

    mqttService.subscribe('crm/leads/+/updated', (topic, message) => {
      this.handleLeadMessage('lead:updated', topic, message);
    });

    mqttService.subscribe('crm/leads/+/assigned', (topic, message) => {
      this.handleLeadMessage('lead:assigned', topic, message);
    });

    // Subscribe to activity-related topics
    mqttService.subscribe('crm/activities/+/created', (topic, message) => {
      this.handleActivityMessage('activity:created', topic, message);
    });

    // Subscribe to user presence topics
    mqttService.subscribe('crm/users/+/presence', (topic, message) => {
      this.handlePresenceMessage('user:presence', topic, message);
    });

    // Subscribe to system-wide notifications
    mqttService.subscribe('crm/notifications/+', (topic, message) => {
      this.handleNotificationMessage('notification', topic, message);
    });

    // Subscribe to collaborative notes
    mqttService.subscribe('crm/notes/+/collaboration', (topic, message) => {
      this.handleCollaborationMessage('note:collaboration', topic, message);
    });

    logger.info('MQTT subscriptions set up successfully');
  }

  private handleLeadMessage(eventType: string, topic: string, message: Buffer): void {
    try {
      const mqttMessage: MQTTMessage = JSON.parse(message.toString());
      const leadId = this.extractIdFromTopic(topic, 'leads');
      
      logger.debug('Handling lead MQTT message', { 
        eventType, 
        topic, 
        leadId,
        messageType: mqttMessage.type 
      });

      // Emit to Socket.IO rooms
      this.io.to(`lead:${leadId}`).emit(eventType, {
        lead: mqttMessage.data,
        leadId,
        timestamp: mqttMessage.timestamp,
        ...mqttMessage.data
      });

      // Emit to global org room for notifications
      this.io.to('org:global').emit(eventType, {
        lead: mqttMessage.data,
        leadId,
        timestamp: mqttMessage.timestamp,
        ...mqttMessage.data
      });

    } catch (error) {
      logger.error('Error handling lead MQTT message', { topic, error });
    }
  }

  private handleActivityMessage(eventType: string, topic: string, message: Buffer): void {
    try {
      const mqttMessage: MQTTMessage = JSON.parse(message.toString());
      const activityId = this.extractIdFromTopic(topic, 'activities');
      
      logger.debug('Handling activity MQTT message', { 
        eventType, 
        topic, 
        activityId,
        messageType: mqttMessage.type 
      });

      // Emit to Socket.IO rooms
      this.io.to(`activity:${activityId}`).emit(eventType, {
        activity: mqttMessage.data,
        activityId,
        timestamp: mqttMessage.timestamp,
        ...mqttMessage.data
      });

      // Emit to lead room if activity is associated with a lead
      if (mqttMessage.data.leadId) {
        this.io.to(`lead:${mqttMessage.data.leadId}`).emit(eventType, {
          activity: mqttMessage.data,
          activityId,
          timestamp: mqttMessage.timestamp,
          ...mqttMessage.data
        });
      }

      // Emit to global org room
      this.io.to('org:global').emit(eventType, {
        activity: mqttMessage.data,
        activityId,
        timestamp: mqttMessage.timestamp,
        ...mqttMessage.data
      });

    } catch (error) {
      logger.error('Error handling activity MQTT message', { topic, error });
    }
  }

  private handlePresenceMessage(eventType: string, topic: string, message: Buffer): void {
    try {
      const mqttMessage: MQTTMessage = JSON.parse(message.toString());
      const userId = this.extractIdFromTopic(topic, 'users');
      
      logger.debug('Handling presence MQTT message', { 
        eventType, 
        topic, 
        userId,
        messageType: mqttMessage.type 
      });

      // Emit to user's personal room
      this.io.to(`user:${userId}`).emit(eventType, {
        user: mqttMessage.data,
        userId,
        timestamp: mqttMessage.timestamp,
        ...mqttMessage.data
      });

      // Emit to global org room for online user updates
      this.io.to('org:global').emit('user:presence', {
        user: mqttMessage.data,
        userId,
        timestamp: mqttMessage.timestamp,
        ...mqttMessage.data
      });

    } catch (error) {
      logger.error('Error handling presence MQTT message', { topic, error });
    }
  }

  private handleNotificationMessage(eventType: string, topic: string, message: Buffer): void {
    try {
      const mqttMessage: MQTTMessage = JSON.parse(message.toString());
      const notificationId = this.extractIdFromTopic(topic, 'notifications');
      
      logger.debug('Handling notification MQTT message', { 
        eventType, 
        topic, 
        notificationId,
        messageType: mqttMessage.type 
      });

      // Emit to specific user if targeted
      if (mqttMessage.userId) {
        this.io.to(`user:${mqttMessage.userId}`).emit(eventType, {
          notification: mqttMessage.data,
          notificationId,
          timestamp: mqttMessage.timestamp,
          ...mqttMessage.data
        });
      } else {
        // Emit to global org room for broadcast notifications
        this.io.to('org:global').emit(eventType, {
          notification: mqttMessage.data,
          notificationId,
          timestamp: mqttMessage.timestamp,
          ...mqttMessage.data
        });
      }

    } catch (error) {
      logger.error('Error handling notification MQTT message', { topic, error });
    }
  }

  private handleCollaborationMessage(eventType: string, topic: string, message: Buffer): void {
    try {
      const mqttMessage: MQTTMessage = JSON.parse(message.toString());
      const noteId = this.extractIdFromTopic(topic, 'notes');
      
      logger.debug('Handling collaboration MQTT message', { 
        eventType, 
        topic, 
        noteId,
        messageType: mqttMessage.type 
      });

      // Emit to note collaboration room
      this.io.to(`note:${noteId}`).emit(eventType, {
        note: mqttMessage.data,
        noteId,
        timestamp: mqttMessage.timestamp,
        ...mqttMessage.data
      });

    } catch (error) {
      logger.error('Error handling collaboration MQTT message', { topic, error });
    }
  }

  private extractIdFromTopic(topic: string, entityType: string): string {
    // Extract ID from topic like "crm/leads/123/created" -> "123"
    const parts = topic.split('/');
    const entityIndex = parts.indexOf(entityType);
    return entityIndex !== -1 && entityIndex + 1 < parts.length ? parts[entityIndex + 1] : '';
  }

  // Methods to publish MQTT messages from Socket.IO events
  public publishLeadEvent(leadId: string, eventType: string, data: any, userId?: string): void {
    const topic = `crm/leads/${leadId}/${eventType}`;
    const message: MQTTMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      userId,
      leadId
    };

    mqttService.publish(topic, message, 1);
    logger.debug('Published lead event to MQTT', { topic, eventType, leadId });
  }

  public publishActivityEvent(activityId: string, eventType: string, data: any, userId?: string): void {
    const topic = `crm/activities/${activityId}/${eventType}`;
    const message: MQTTMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      userId,
      activityId
    };

    mqttService.publish(topic, message, 1);
    logger.debug('Published activity event to MQTT', { topic, eventType, activityId });
  }

  public publishPresenceEvent(userId: string, eventType: string, data: any): void {
    const topic = `crm/users/${userId}/presence`;
    const message: MQTTMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      userId
    };

    mqttService.publish(topic, message, 1);
    logger.debug('Published presence event to MQTT', { topic, eventType, userId });
  }

  public publishNotification(notificationId: string, data: any, targetUserId?: string): void {
    const topic = targetUserId 
      ? `crm/notifications/${notificationId}`
      : `crm/notifications/${notificationId}`;
    
    const message: MQTTMessage = {
      type: 'notification',
      data,
      timestamp: new Date().toISOString(),
      userId: targetUserId
    };

    mqttService.publish(topic, message, 1);
    logger.debug('Published notification to MQTT', { topic, notificationId, targetUserId });
  }

  public publishCollaborationEvent(noteId: string, eventType: string, data: any, userId?: string): void {
    const topic = `crm/notes/${noteId}/collaboration`;
    const message: MQTTMessage = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      userId
    };

    mqttService.publish(topic, message, 1);
    logger.debug('Published collaboration event to MQTT', { topic, eventType, noteId });
  }

  public async cleanup(): Promise<void> {
    if (this.isInitialized) {
      await mqttService.disconnect();
      this.isInitialized = false;
      logger.info('MQTT Bridge cleaned up');
    }
  }
}
