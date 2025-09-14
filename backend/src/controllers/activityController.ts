import { Request, Response } from 'express';
import { Activity, Lead, User } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';

export class ActivityController {
  // GET /api/activities/lead/:leadId - Get activities for a lead
  static async getLeadActivities(req: Request, res: Response): Promise<void> {
    try {
      const { leadId } = req.params;

      // Verify lead exists
      const lead = await Lead.findByPk(leadId);
      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
        return;
      }

      const activities = await Activity.findAll({
        where: { leadId },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Transform activities to match frontend expectations
      const transformedActivities = activities.map(activity => ({
        id: activity.id,
        leadId: activity.leadId,
        type: activity.type.toLowerCase(), // Convert to lowercase
        title: activity.body?.split('\n')[0] || 'Untitled', // Use first line as title
        body: activity.body || '',
        createdAt: activity.createdAt,
        user: {
          id: activity.creator?.id || '',
          name: activity.creator?.name || 'Unknown',
          email: activity.creator?.email || ''
        }
      }));

      res.json({
        success: true,
        data: { activities: transformedActivities }
      });
    } catch (error) {
      console.error('Get lead activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities'
      });
    }
  }

  // GET /api/activities - Get all activities
  static async getAllActivities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', leadId, type, userId } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const whereClause: any = {};
      if (leadId) whereClause.leadId = leadId;
      if (type && typeof type === 'string') whereClause.type = type.toUpperCase();
      if (userId) whereClause.createdBy = userId;

      const activities = await Activity.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Lead,
            as: 'lead',
            attributes: ['id', 'title', 'description'],
            include: [
              {
                model: User,
                as: 'owner',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ],
        limit: limitNum,
        offset: offset,
        order: [['createdAt', 'DESC']]
      });


      // Transform activities to match frontend expectations
      const transformedActivities = activities.rows.map(activity => ({
        id: activity.id,
        leadId: activity.leadId,
        type: activity.type.toLowerCase(),
        title: activity.body?.split('\n')[0] || 'Untitled',
        body: activity.body || '',
        createdAt: activity.createdAt,
        user: {
          id: activity.creator?.id || '',
          name: activity.creator?.name || 'Unknown',
          email: activity.creator?.email || ''
        },
        lead: {
          id: activity.lead?.id || '',
          company: activity.lead?.title || 'Unknown Company',
          contactName: activity.lead?.description || 'Unknown Contact',
          owner: {
            id: activity.lead?.owner?.id || '',
            name: activity.lead?.owner?.name || 'Unknown Owner',
            email: activity.lead?.owner?.email || ''
          }
        }
      }));

      res.json({
        success: true,
        data: {
          activities: transformedActivities,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: activities.count,
            totalPages: Math.ceil(activities.count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('Get all activities error:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities'
      });
    }
  }

  // GET /api/activities/:id - Get activity by ID
  static async getActivityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const activity = await Activity.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!activity) {
        res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
        return;
      }

      // Transform activity to match frontend expectations
      const transformedActivity = {
        id: activity.id,
        leadId: activity.leadId,
        type: activity.type.toLowerCase(),
        title: activity.body?.split('\n')[0] || 'Untitled',
        body: activity.body || '',
        createdAt: activity.createdAt,
        user: {
          id: activity.creator?.id || '',
          name: activity.creator?.name || 'Unknown',
          email: activity.creator?.email || ''
        }
      };

      res.json({
        success: true,
        data: { activity: transformedActivity }
      });
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity'
      });
    }
  }

  // POST /api/activities - Create activity
  static async createActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { leadId, type, title, body } = req.body;
      const createdBy = req.user!.id;

      // Verify lead exists
      const lead = await Lead.findByPk(leadId);
      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
        return;
      }

      // Combine title and body for storage
      const activityBody = title ? `${title}\n${body || ''}` : body;

      const activity = await Activity.create({
        leadId,
        type: type.toUpperCase(), // Convert to uppercase for database
        body: activityBody,
        createdBy
      });

      // Fetch activity with creator information
      const activityWithCreator = await Activity.findByPk(activity.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Transform activity to match frontend expectations
      const transformedActivity = {
        id: activityWithCreator!.id,
        leadId: activityWithCreator!.leadId,
        type: activityWithCreator!.type.toLowerCase(),
        title: title || activityWithCreator!.body?.split('\n')[0] || 'Untitled',
        body: activityWithCreator!.body || '',
        createdAt: activityWithCreator!.createdAt,
        user: {
          id: activityWithCreator!.creator?.id || '',
          name: activityWithCreator!.creator?.name || 'Unknown',
          email: activityWithCreator!.creator?.email || ''
        }
      };

      // Emit socket event for the specific lead
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        socketHandler.emitActivityCreated(transformedActivity, leadId, {
          id: req.user!.id,
          email: req.user!.email,
          role: req.user!.role
        });
      }

      res.status(201).json({
        success: true,
        message: 'Activity created successfully',
        data: { activity: transformedActivity }
      });
    } catch (error) {
      console.error('Create activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create activity'
      });
    }
  }

  // PUT /api/activities/:id - Update activity
  static async updateActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { type, title, body } = req.body;

      const activity = await Activity.findByPk(id);
      if (!activity) {
        res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
        return;
      }

      // Combine title and body for storage
      const activityBody = title ? `${title}\n${body || ''}` : body;

      await activity.update({
        type: type ? type.toUpperCase() : activity.type,
        body: activityBody || activity.body
      });

      // Fetch updated activity with creator information
      const updatedActivity = await Activity.findByPk(activity.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Transform activity to match frontend expectations
      const transformedActivity = {
        id: updatedActivity!.id,
        leadId: updatedActivity!.leadId,
        type: updatedActivity!.type.toLowerCase(),
        title: title || updatedActivity!.body?.split('\n')[0] || 'Untitled',
        body: updatedActivity!.body || '',
        createdAt: updatedActivity!.createdAt,
        user: {
          id: updatedActivity!.creator?.id || '',
          name: updatedActivity!.creator?.name || 'Unknown',
          email: updatedActivity!.creator?.email || ''
        }
      };

      res.json({
        success: true,
        message: 'Activity updated successfully',
        data: { activity: transformedActivity }
      });
    } catch (error) {
      console.error('Update activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update activity'
      });
    }
  }

  // DELETE /api/activities/:id - Delete activity
  static async deleteActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const activity = await Activity.findByPk(id);
      if (!activity) {
        res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
        return;
      }

      await activity.destroy();

      res.json({
        success: true,
        message: 'Activity deleted successfully'
      });
    } catch (error) {
      console.error('Delete activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete activity'
      });
    }
  }
}
