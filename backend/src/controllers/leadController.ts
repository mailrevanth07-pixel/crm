import { Request, Response } from 'express';
import { Lead, User, Activity } from '../models';
import { AuthenticatedRequest } from '../middleware/auth';
import { Op } from 'sequelize';

export class LeadController {
  // GET /api/leads/stats - Get leads statistics
  static async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let whereClause: any = {};
      
      // SALES users can only see their own leads
      if (req.user!.role === 'SALES') {
        whereClause.ownerId = req.user!.id;
      }

      const totalLeads = await Lead.count({ where: whereClause });
      
      // Calculate open and closed leads based on status
      const openLeads = await Lead.count({ 
        where: { 
          ...whereClause, 
          status: { [Op.in]: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] } 
        } 
      });
      
      const closedLeads = await Lead.count({ 
        where: { 
          ...whereClause, 
          status: { [Op.in]: ['CLOSED_WON', 'CLOSED_LOST'] } 
        } 
      });
      
      const leadsAssignedToMe = await Lead.count({ where: { ownerId: req.user!.id } });

      res.json({
        totalLeads,
        openLeads,
        closedLeads,
        leadsAssignedToMe
      });
    } catch (error) {
      console.error('Get leads stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leads statistics'
      });
    }
  }

  // GET /api/leads - Get paginated list of leads
  static async getLeads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { owner, status, page = 1, limit = 10, groupBy } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build where clause
      const whereClause: any = {};
      
      // SALES users can only see their own leads
      if (req.user!.role === 'SALES') {
        whereClause.ownerId = req.user!.id;
      }
      
      if (owner) {
        whereClause.ownerId = owner;
      }
      
      if (status) {
        whereClause.status = status;
      }

      // Handle groupBy=status for dashboard
      if (groupBy === 'status') {
        const statusCounts = await Lead.findAll({
          where: whereClause,
          attributes: [
            'status',
            [Lead.sequelize!.fn('COUNT', Lead.sequelize!.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        });

        const total = statusCounts.reduce((sum, item: any) => sum + parseInt(item.count), 0);
        
        const leadsByStatus = statusCounts.map((item: any) => ({
          status: item.status.toLowerCase().replace('_', '-'),
          count: parseInt(item.count),
          percentage: total > 0 ? Math.round((parseInt(item.count) / total) * 100) : 0
        }));

        res.json(leadsByStatus);
        return;
      }

      const { count, rows: leads } = await Lead.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / Number(limit));

      // Transform leads to match frontend format
      const transformedLeads = leads.map(lead => ({
        id: lead.id,
        title: lead.title,
        description: lead.description || '',
        status: lead.status.toUpperCase(),
        owner: lead.owner ? {
          id: lead.owner.id,
          name: lead.owner.name,
          email: lead.owner.email
        } : {
          id: '',
          name: 'Unassigned',
          email: ''
        },
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      }));

      res.json({
        success: true,
        data: {
          leads: transformedLeads,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalItems: count,
            itemsPerPage: Number(limit),
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Get leads error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leads'
      });
    }
  }

  // GET /api/leads/:id - Get single lead with owner and activities
  static async getLeadById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const lead = await Lead.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Activity,
            as: 'activities',
            include: [
              {
                model: User,
                as: 'creator',
                attributes: ['id', 'name', 'email']
              }
            ],
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { lead }
      });
    } catch (error) {
      console.error('Get lead by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lead'
      });
    }
  }

  // POST /api/leads - Create new lead
  static async createLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, status = 'NEW', source, ownerId, metadata } = req.body;
      const createdBy = req.user!.id;

      // If ownerId is provided, verify the user exists
      if (ownerId) {
        const owner = await User.findByPk(ownerId);
        if (!owner) {
          res.status(400).json({
            success: false,
            message: 'Owner not found'
          });
          return;
        }
      }

      const lead = await Lead.create({
        title,
        description,
        status,
        source,
        ownerId: ownerId || null,
        metadata
      });

      // Fetch the lead with owner information
      const leadWithOwner = await Lead.findByPk(lead.id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Emit socket event
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        socketHandler.emitLeadCreated(leadWithOwner, {
          id: req.user!.id,
          email: req.user!.email,
          role: req.user!.role
        });
      }

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: { lead: leadWithOwner }
      });
    } catch (error) {
      console.error('Create lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create lead'
      });
    }
  }

  // PUT /api/leads/:id - Update lead
  static async updateLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
        return;
      }

      // If ownerId is being updated, verify the user exists
      if (updateData.ownerId) {
        const owner = await User.findByPk(updateData.ownerId);
        if (!owner) {
          res.status(400).json({
            success: false,
            message: 'Owner not found'
          });
          return;
        }
      }

      await lead.update(updateData);

      // Fetch updated lead with owner information
      const updatedLead = await Lead.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Emit socket event
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        socketHandler.emitLeadUpdated(updatedLead, {
          id: req.user?.id,
          email: req.user?.email,
          role: req.user?.role
        });
      }

      res.json({
        success: true,
        message: 'Lead updated successfully',
        data: { lead: updatedLead }
      });
    } catch (error) {
      console.error('Update lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update lead'
      });
    }
  }

  // DELETE /api/leads/:id - Delete lead
  static async deleteLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
        return;
      }

      await lead.destroy();

      // Emit socket event
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        socketHandler.emitLeadDeleted(id, {
          id: req.user?.id,
          email: req.user?.email,
          role: req.user?.role
        });
      }

      res.json({
        success: true,
        message: 'Lead deleted successfully'
      });
    } catch (error) {
      console.error('Delete lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lead'
      });
    }
  }

  // POST /api/leads/:id/assign - Assign lead to owner
  static async assignLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { ownerId } = req.body;

      const lead = await Lead.findByPk(id);
      if (!lead) {
        res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
        return;
      }

      // Verify the owner exists
      const owner = await User.findByPk(ownerId);
      if (!owner) {
        res.status(400).json({
          success: false,
          message: 'Owner not found'
        });
        return;
      }

      const previousOwnerId = lead.ownerId;
      await lead.update({ ownerId });

      // Fetch updated lead with owner information
      const updatedLead = await Lead.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      // Emit socket event
      const socketHandler = req.app.get('socketHandler');
      if (socketHandler) {
        socketHandler.emitLeadAssigned(updatedLead, previousOwnerId, {
          id: req.user?.id,
          email: req.user?.email,
          role: req.user?.role
        });
      }

      res.json({
        success: true,
        message: 'Lead assigned successfully',
        data: { lead: updatedLead }
      });
    } catch (error) {
      console.error('Assign lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign lead'
      });
    }
  }
}
