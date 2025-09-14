import { jobQueueService } from './jobQueue';
import { User, Lead, Activity, CollaborativeNote } from '../models';
import { redisService } from '../config/redis';

export interface NotificationData {
  id?: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  priority: 'low' | 'normal' | 'high';
  read: boolean;
  timestamp: string;
  category: 'lead' | 'activity' | 'note' | 'system' | 'collaboration';
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Send a notification to a specific user
  public async sendNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data: any;
    priority?: 'low' | 'normal' | 'high';
    category?: 'lead' | 'activity' | 'note' | 'system' | 'collaboration';
    delay?: number;
  }): Promise<void> {
    try {
      await jobQueueService.addNotificationJob({
        userId: data.userId,
        type: data.type,
        data: {
          title: data.title,
          message: data.message,
          data: data.data,
          category: data.category || 'system'
        },
        priority: data.priority || 'normal',
        delay: data.delay || 0
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  public async sendBulkNotification(data: {
    userIds: string[];
    type: string;
    title: string;
    message: string;
    data: any;
    priority?: 'low' | 'normal' | 'high';
    category?: 'lead' | 'activity' | 'note' | 'system' | 'collaboration';
    delay?: number;
  }): Promise<void> {
    const promises = data.userIds.map(userId => 
      this.sendNotification({
        ...data,
        userId
      })
    );

    await Promise.all(promises);
  }

  // Lead-related notifications
  public async notifyLeadCreated(lead: Lead, createdBy: User): Promise<void> {
    // Notify managers and admins
    const managers = await User.findAll({
      where: {
        role: ['MANAGER', 'ADMIN']
      }
    });

    await this.sendBulkNotification({
      userIds: managers.map(u => u.id),
      type: 'lead_created',
      title: 'New Lead Created',
      message: `${createdBy.name || createdBy.email} created a new lead: ${lead.title}`,
      data: {
        leadId: lead.id,
        leadTitle: lead.title,
        createdBy: {
          id: createdBy.id,
          name: createdBy.name || createdBy.email,
          email: createdBy.email
        }
      },
      category: 'lead',
      priority: 'normal'
    });
  }

  public async notifyLeadAssigned(lead: Lead, previousOwnerId: string | null, assignedBy: User, newOwner: User): Promise<void> {
    // Notify the new owner
    await this.sendNotification({
      userId: newOwner.id,
      type: 'lead_assigned',
      title: 'Lead Assigned to You',
      message: `${assignedBy.name || assignedBy.email} assigned lead "${lead.title}" to you`,
      data: {
        leadId: lead.id,
        leadTitle: lead.title,
        assignedBy: {
          id: assignedBy.id,
          name: assignedBy.name || assignedBy.email,
          email: assignedBy.email
        }
      },
      category: 'lead',
      priority: 'high'
    });

    // Notify the previous owner if different
    if (previousOwnerId && previousOwnerId !== newOwner.id) {
      await this.sendNotification({
        userId: previousOwnerId,
        type: 'lead_unassigned',
        title: 'Lead Unassigned',
        message: `Lead "${lead.title}" has been reassigned to ${newOwner.name || newOwner.email}`,
        data: {
          leadId: lead.id,
          leadTitle: lead.title,
          newOwner: {
            id: newOwner.id,
            name: newOwner.name || newOwner.email,
            email: newOwner.email
          }
        },
        category: 'lead',
        priority: 'normal'
      });
    }
  }

  public async notifyLeadStatusChanged(lead: Lead, oldStatus: string, updatedBy: User): Promise<void> {
    // Notify the lead owner
    if (lead.ownerId) {
      await this.sendNotification({
        userId: lead.ownerId,
        type: 'lead_status_changed',
        title: 'Lead Status Updated',
        message: `Lead "${lead.title}" status changed from ${oldStatus} to ${lead.status}`,
        data: {
          leadId: lead.id,
          leadTitle: lead.title,
          oldStatus,
          newStatus: lead.status,
          updatedBy: {
            id: updatedBy.id,
            name: updatedBy.name || updatedBy.email,
            email: updatedBy.email
          }
        },
        category: 'lead',
        priority: 'normal'
      });
    }
  }

  // Activity-related notifications
  public async notifyActivityCreated(activity: Activity, lead: Lead, createdBy: User): Promise<void> {
    // Notify the lead owner if different from creator
    if (lead.ownerId && lead.ownerId !== createdBy.id) {
      await this.sendNotification({
        userId: lead.ownerId,
        type: 'activity_created',
        title: 'New Activity Added',
        message: `${createdBy.name || createdBy.email} added a new ${activity.type} activity to lead "${lead.title}"`,
        data: {
          activityId: activity.id,
          activityType: activity.type,
          leadId: lead.id,
          leadTitle: lead.title,
          createdBy: {
            id: createdBy.id,
            name: createdBy.name || createdBy.email,
            email: createdBy.email
          }
        },
        category: 'activity',
        priority: 'normal'
      });
    }
  }

  // Collaborative note notifications
  public async notifyNoteShared(note: CollaborativeNote, sharedBy: User, sharedWith: User[]): Promise<void> {
    await this.sendBulkNotification({
      userIds: sharedWith.map(u => u.id),
      type: 'note_shared',
      title: 'Note Shared with You',
      message: `${sharedBy.name || sharedBy.email} shared note "${note.title}" with you`,
      data: {
        noteId: note.id,
        noteTitle: note.title,
        sharedBy: {
          id: sharedBy.id,
          name: sharedBy.name || sharedBy.email,
          email: sharedBy.email
        },
        permissions: note.permissions
      },
      category: 'note',
      priority: 'normal'
    });
  }

  public async notifyNoteEdited(note: CollaborativeNote, editedBy: User, participants: User[]): Promise<void> {
    // Notify other participants
    const otherParticipants = participants.filter(u => u.id !== editedBy.id);
    
    if (otherParticipants.length > 0) {
      await this.sendBulkNotification({
        userIds: otherParticipants.map(u => u.id),
        type: 'note_edited',
        title: 'Note Edited',
        message: `${editedBy.name || editedBy.email} edited note "${note.title}"`,
        data: {
          noteId: note.id,
          noteTitle: note.title,
          editedBy: {
            id: editedBy.id,
            name: editedBy.name || editedBy.email,
            email: editedBy.email
          }
        },
        category: 'collaboration',
        priority: 'low'
      });
    }
  }

  public async notifyUserJoinedNote(note: CollaborativeNote, joinedUser: User, participants: User[]): Promise<void> {
    // Notify existing participants
    const otherParticipants = participants.filter(u => u.id !== joinedUser.id);
    
    if (otherParticipants.length > 0) {
      await this.sendBulkNotification({
        userIds: otherParticipants.map(u => u.id),
        type: 'user_joined_note',
        title: 'User Joined Note',
        message: `${joinedUser.name || joinedUser.email} joined note "${note.title}"`,
        data: {
          noteId: note.id,
          noteTitle: note.title,
          joinedUser: {
            id: joinedUser.id,
            name: joinedUser.name || joinedUser.email,
            email: joinedUser.email
          }
        },
        category: 'collaboration',
        priority: 'low'
      });
    }
  }

  // System notifications
  public async notifySystemMaintenance(message: string, scheduledTime?: Date): Promise<void> {
    const allUsers = await User.findAll({
      attributes: ['id']
    });

    await this.sendBulkNotification({
      userIds: allUsers.map(u => u.id),
      type: 'system_maintenance',
      title: 'System Maintenance',
      message,
      data: {
        scheduledTime: scheduledTime?.toISOString(),
        message
      },
      category: 'system',
      priority: 'high',
      delay: scheduledTime ? scheduledTime.getTime() - Date.now() : 0
    });
  }

  // Get user notifications
  public async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationData[]> {
    try {
      const notifications = await redisService.lrange(`notifications:${userId}`, 0, limit - 1);
      return (notifications as NotificationData[]).reverse(); // Most recent first
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  public async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notifications = await redisService.lrange(`notifications:${userId}`, 0, -1);
      const updatedNotifications = notifications.map((notification: any) => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });

      // Update Redis
      await redisService.del(`notifications:${userId}`);
      for (const notification of updatedNotifications) {
        await redisService.lpush(`notifications:${userId}`, notification);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const notifications = await redisService.lrange(`notifications:${userId}`, 0, -1);
      const updatedNotifications = notifications.map((notification: any) => ({
        ...notification,
        read: true
      }));

      // Update Redis
      await redisService.del(`notifications:${userId}`);
      for (const notification of updatedNotifications) {
        await redisService.lpush(`notifications:${userId}`, notification);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get notification statistics
  public async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const notifications = await redisService.lrange(`notifications:${userId}`, 0, -1);
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter((n: any) => !n.read).length,
        byCategory: {} as Record<string, number>
      };

      notifications.forEach((notification: any) => {
        const category = notification.data?.category || 'system';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { total: 0, unread: 0, byCategory: {} };
    }
  }
}

export const notificationService = NotificationService.getInstance();
