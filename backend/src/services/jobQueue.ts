import Bull from 'bull';
import { redisService } from '../config/redis';
import { User, Lead, Activity, CollaborativeNote, UserPresence } from '../models';
import { SocketHandler } from '../socket/socketHandler';

// Job queue for background processing
export class JobQueueService {
  private static instance: JobQueueService;
  private notificationQueue?: Bull.Queue;
  private emailQueue?: Bull.Queue;
  private cleanupQueue?: Bull.Queue;
  private socketHandler?: SocketHandler;

  private constructor() {
    const redisUrl = process.env.REDIS_URL;
    
    // Only initialize job queues if Redis URL is provided
    if (!redisUrl) {
      console.warn('⚠️  REDIS_URL not provided, job queues will not be initialized');
      return;
    }
    
    try {
      // Initialize job queues with error handling
      this.notificationQueue = new Bull('notification-queue', redisUrl, {
        redis: {
          connectTimeout: 10000,
          lazyConnect: true,
          maxRetriesPerRequest: 3
        }
      });
      this.emailQueue = new Bull('email-queue', redisUrl, {
        redis: {
          connectTimeout: 10000,
          lazyConnect: true,
          maxRetriesPerRequest: 3
        }
      });
      this.cleanupQueue = new Bull('cleanup-queue', redisUrl, {
        redis: {
          connectTimeout: 10000,
          lazyConnect: true,
          maxRetriesPerRequest: 3
        }
      });

      this.setupJobProcessors();
      this.setupJobEvents();
    } catch (error) {
      console.error('Failed to initialize job queues:', error);
      throw error;
    }
  }

  public static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  public setSocketHandler(socketHandler: SocketHandler): void {
    this.socketHandler = socketHandler;
  }

  private setupJobProcessors(): void {
    // Process notification jobs
    this.notificationQueue.process('send-notification', async (job) => {
      const { userId, type, data, priority = 'normal' } = job.data;
      
      try {
        // Get user
        const user = await User.findByPk(userId);
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        // Create notification data
        const notification = {
          id: job.id,
          userId,
          type,
          data,
          priority,
          timestamp: new Date().toISOString(),
          read: false
        };

        // Store notification in Redis for real-time access
        await redisService.lpush(`notifications:${userId}`, notification);
        
        // Emit real-time notification via Socket.IO
        if (this.socketHandler) {
          this.socketHandler.emitToUser(userId, 'notification:new', notification);
        }

        // Store in database for persistence
        await Activity.create({
          type: 'NOTE',
          body: `Notification: ${type}`,
          leadId: data.leadId || null,
          createdBy: 'system'
        });

        return { success: true, notificationId: job.id };
      } catch (error) {
        console.error('Error processing notification job:', error);
        throw error;
      }
    });

    // Process email jobs
    this.emailQueue.process('send-email', async (job) => {
      const { to, subject, template, data, priority = 'normal' } = job.data;
      
      try {
        // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, emailId: job.id };
      } catch (error) {
        console.error('Error processing email job:', error);
        throw error;
      }
    });

    // Process cleanup jobs
    this.cleanupQueue.process('cleanup-expired-sessions', async (job) => {
      try {
        const { thresholdHours = 24 } = job.data;
        const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
        
        // Clean up expired user presences
        const expiredPresences = await UserPresence.findAll({
          where: {
            lastSeen: {
              [require('sequelize').Op.lt]: threshold
            },
            isActive: true
          }
        });

        for (const presence of expiredPresences) {
          presence.markInactive();
          await presence.save();
        }

        return { success: true, cleanedCount: expiredPresences.length };
      } catch (error) {
        console.error('Error processing cleanup job:', error);
        throw error;
      }
    });

    this.cleanupQueue.process('cleanup-old-notifications', async (job) => {
      try {
        const { thresholdDays = 30 } = job.data;
        const threshold = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
        
        // Clean up old notifications from Redis
        const users = await User.findAll({ attributes: ['id'] });
        let totalCleaned = 0;
        
        for (const user of users) {
          const notifications = await redisService.lrange(`notifications:${user.id}`, 0, -1);
          const recentNotifications = notifications.filter((notification: any) => 
            new Date(notification.timestamp) > threshold
          );
          
          if (recentNotifications.length !== notifications.length) {
            // Clear and repopulate with recent notifications
            await redisService.del(`notifications:${user.id}`);
            for (const notification of recentNotifications) {
              await redisService.lpush(`notifications:${user.id}`, notification);
            }
            totalCleaned += notifications.length - recentNotifications.length;
          }
        }

        return { success: true, cleanedCount: totalCleaned };
      } catch (error) {
        console.error('Error processing notification cleanup job:', error);
        throw error;
      }
    });
  }

  private setupJobEvents(): void {
    // Notification queue events
    this.notificationQueue.on('completed', (job) => {
      // Job completed successfully
    });

    this.notificationQueue.on('failed', (job, err) => {
      console.error(`Notification job ${job.id} failed:`, err);
    });

    // Email queue events
    this.emailQueue.on('completed', (job) => {
      // Job completed successfully
    });

    this.emailQueue.on('failed', (job, err) => {
      console.error(`Email job ${job.id} failed:`, err);
    });

    // Cleanup queue events
    this.cleanupQueue.on('completed', (job) => {
      // Job completed successfully
    });

    this.cleanupQueue.on('failed', (job, err) => {
      console.error(`Cleanup job ${job.id} failed:`, err);
    });
  }

  // Add notification job
  public async addNotificationJob(data: {
    userId: string;
    type: string;
    data: any;
    priority?: 'low' | 'normal' | 'high';
    delay?: number;
  }): Promise<Bull.Job | null> {
    if (!this.notificationQueue) {
      console.warn('⚠️  Notification queue not initialized, skipping job');
      return null;
    }
    return this.notificationQueue.add('send-notification', data, {
      priority: this.getPriorityValue(data.priority),
      delay: data.delay || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }

  // Add email job
  public async addEmailJob(data: {
    to: string | string[];
    subject: string;
    template: string;
    data: any;
    priority?: 'low' | 'normal' | 'high';
    delay?: number;
  }): Promise<Bull.Job | null> {
    if (!this.emailQueue) {
      console.warn('⚠️  Email queue not initialized, skipping job');
      return null;
    }
    return this.emailQueue.add('send-email', data, {
      priority: this.getPriorityValue(data.priority),
      delay: data.delay || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }

  // Add cleanup job
  public async addCleanupJob(type: string, data: any = {}, delay: number = 0): Promise<Bull.Job | null> {
    if (!this.cleanupQueue) {
      console.warn('⚠️  Cleanup queue not initialized, skipping job');
      return null;
    }
    return this.cleanupQueue.add(type, data, {
      delay,
      attempts: 1
    });
  }

  // Schedule recurring cleanup jobs
  public scheduleRecurringJobs(): void {
    if (!this.cleanupQueue) {
      console.warn('⚠️  Cleanup queue not initialized, skipping recurring jobs');
      return;
    }
    
    // Clean up expired sessions every hour
    this.cleanupQueue.add('cleanup-expired-sessions', {}, {
      repeat: { cron: '0 * * * *' }, // Every hour
      removeOnComplete: 10,
      removeOnFail: 5
    });

    // Clean up old notifications daily
    this.cleanupQueue.add('cleanup-old-notifications', {}, {
      repeat: { cron: '0 2 * * *' }, // Daily at 2 AM
      removeOnComplete: 10,
      removeOnFail: 5
    });
  }

  // Get queue statistics
  public async getQueueStats(): Promise<any> {
    if (!this.notificationQueue || !this.emailQueue || !this.cleanupQueue) {
      return {
        notification: { waiting: 0, active: 0, completed: 0, failed: 0 },
        email: { waiting: 0, active: 0, completed: 0, failed: 0 },
        cleanup: { waiting: 0, active: 0, completed: 0, failed: 0 },
        total: { waiting: 0, active: 0, completed: 0, failed: 0 },
        message: 'Queues not initialized'
      };
    }

    const [notificationStats, emailStats, cleanupStats] = await Promise.all([
      this.getQueueStatsForQueue(this.notificationQueue),
      this.getQueueStatsForQueue(this.emailQueue),
      this.getQueueStatsForQueue(this.cleanupQueue)
    ]);

    return {
      notification: notificationStats,
      email: emailStats,
      cleanup: cleanupStats,
      total: {
        waiting: notificationStats.waiting + emailStats.waiting + cleanupStats.waiting,
        active: notificationStats.active + emailStats.active + cleanupStats.active,
        completed: notificationStats.completed + emailStats.completed + cleanupStats.completed,
        failed: notificationStats.failed + emailStats.failed + cleanupStats.failed
      }
    };
  }

  private async getQueueStatsForQueue(queue?: Bull.Queue): Promise<any> {
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
    
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  private getPriorityValue(priority?: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high': return 1;
      case 'normal': return 0;
      case 'low': return -1;
      default: return 0;
    }
  }

  // Clean up resources
  public async close(): Promise<void> {
    const closePromises = [];
    
    if (this.notificationQueue) {
      closePromises.push(this.notificationQueue.close());
    }
    if (this.emailQueue) {
      closePromises.push(this.emailQueue.close());
    }
    if (this.cleanupQueue) {
      closePromises.push(this.cleanupQueue.close());
    }
    
    await Promise.all(closePromises);
  }
}

export const jobQueueService = JobQueueService.getInstance();
