import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { Activity, User } from '../models';
import { Op } from 'sequelize';

const router = express.Router();

// Polling endpoint for real-time updates
router.get('/poll', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const lastPollTime = req.query.lastPollTime ? new Date(req.query.lastPollTime as string) : new Date(Date.now() - 60000); // Default to 1 minute ago

    console.log('Realtime poll request', {
      userId,
      lastPollTime: lastPollTime.toISOString(),
      userAgent: req.headers['user-agent']
    });

    // Get recent activities
    const activities = await Activity.findAll({
      where: {
        createdAt: {
          [Op.gte]: lastPollTime
        }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Get online users (simplified - in real implementation, you'd track this)
    const onlineUsers = await User.findAll({
      where: {
        updatedAt: {
          [Op.gte]: new Date(Date.now() - 300000) // Active in last 5 minutes
        }
      },
      attributes: ['id', 'name', 'email', 'updatedAt'],
      limit: 100
    });

    // Get notifications (you can implement a proper notification system)
    const notifications: any[] = []; // Placeholder for notifications

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        activities: activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          body: activity.body,
          createdAt: activity.createdAt,
          user: (activity as any).creator ? {
            id: (activity as any).creator.id,
            name: (activity as any).creator.name,
            email: (activity as any).creator.email
          } : null
        })),
        presence: {
          onlineUsers: onlineUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            lastActiveAt: user.updatedAt
          })),
          totalOnline: onlineUsers.length
        },
        notifications
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Realtime poll error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time updates'
    });
  }
});

export default router;
