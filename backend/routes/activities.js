const express = require('express');
const { Activity, Lead, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get activities for a lead
router.get('/lead/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // First check if user has access to the lead
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // SALES users can only see activities for their own leads
    if (req.user.role === 'SALES' && lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activities = await Activity.findAndCountAll({
      where: { leadId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      activities: activities.rows,
      total: activities.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(activities.count / limit)
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get activity by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: Lead,
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // SALES users can only see activities for their own leads
    if (req.user.role === 'SALES' && activity.Lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create activity
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { leadId, type, body } = req.body;

    if (!leadId || !type) {
      return res.status(400).json({ error: 'Lead ID and type are required' });
    }

    // Check if lead exists and user has access
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // SALES users can only add activities to their own leads
    if (req.user.role === 'SALES' && lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activity = await Activity.create({
      leadId,
      type,
      body,
      createdBy: req.user.id
    });

    const activityWithRelations = await Activity.findByPk(activity.id, {
      include: [
        {
          model: Lead,
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(activityWithRelations);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update activity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, body } = req.body;

    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: Lead,
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // SALES users can only update activities for their own leads
    if (req.user.role === 'SALES' && activity.Lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await activity.update({ type, body });

    const updatedActivity = await Activity.findByPk(activity.id, {
      include: [
        {
          model: Lead,
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedActivity);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: Lead,
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // SALES users can only delete activities for their own leads
    if (req.user.role === 'SALES' && activity.Lead.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await activity.destroy();
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
