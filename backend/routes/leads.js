const express = require('express');
const { Lead, User, Activity } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get leads statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    
    // SALES users can only see their own leads
    if (req.user.role === 'SALES') {
      whereClause.ownerId = req.user.id;
    }

    const [totalLeads, openLeads, closedLeads, leadsAssignedToMe] = await Promise.all([
      Lead.count({ where: whereClause }),
      Lead.count({ where: { ...whereClause, status: { [require('sequelize').Op.in]: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] } } }),
      Lead.count({ where: { ...whereClause, status: { [require('sequelize').Op.in]: ['CLOSED_WON', 'CLOSED_LOST'] } } }),
      Lead.count({ where: { ownerId: req.user.id } })
    ]);

    res.json({
      totalLeads,
      openLeads,
      closedLeads,
      leadsAssignedToMe
    });
  } catch (error) {
    console.error('Get leads stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all leads
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, ownerId, page = 1, limit = 10, groupBy } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    // SALES users can only see their own leads
    if (req.user.role === 'SALES') {
      whereClause.ownerId = req.user.id;
    } else if (ownerId && req.user.role !== 'ADMIN') {
      whereClause.ownerId = ownerId;
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
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const total = statusCounts.reduce((sum, item) => sum + parseInt(item.count), 0);
      
      const leadsByStatus = statusCounts.map(item => ({
        status: item.status.toLowerCase().replace('_', '-'),
        count: parseInt(item.count),
        percentage: total > 0 ? Math.round((parseInt(item.count) / total) * 100) : 0
      }));

      return res.json(leadsByStatus);
    }

    const leads = await Lead.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      leads: leads.rows,
      total: leads.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(leads.count / limit)
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lead by ID
router.get('/:id', authenticateToken, async (req, res) => {
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
      return res.status(404).json({ error: 'Lead not found' });
    }

    // SALES users can only see their own leads
    if (req.user.role === 'SALES' && lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create lead
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, status, source, ownerId, metadata } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // SALES users can only assign leads to themselves
    const assignedOwnerId = req.user.role === 'SALES' ? req.user.id : ownerId;

    const lead = await Lead.create({
      title,
      description,
      status: status || 'NEW',
      source,
      ownerId: assignedOwnerId,
      metadata
    });

    const leadWithOwner = await Lead.findByPk(lead.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(leadWithOwner);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lead
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, source, ownerId, metadata } = req.body;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // SALES users can only update their own leads
    if (req.user.role === 'SALES' && lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only MANAGER and ADMIN can change ownership
    const newOwnerId = (req.user.role === 'SALES') ? lead.ownerId : ownerId;

    await lead.update({
      title,
      description,
      status,
      source,
      ownerId: newOwnerId,
      metadata
    });

    const updatedLead = await Lead.findByPk(lead.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedLead);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete lead
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // SALES users can only delete their own leads
    if (req.user.role === 'SALES' && lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await lead.destroy();
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
