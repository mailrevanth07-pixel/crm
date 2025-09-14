import express from 'express';
import { User } from '../models';
import { authMiddleware, roleGuard, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Create user (ADMIN only)
router.post('/', authMiddleware, roleGuard(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, password, role = 'SALES' } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role as 'ADMIN' | 'MANAGER' | 'SALES'
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all users (ADMIN only)
router.get('/', authMiddleware, roleGuard(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
    });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own profile unless they're ADMIN
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update user
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    // Users can only update their own profile unless they're ADMIN
    if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Only ADMIN can change roles
    if (role && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        error: 'Only administrators can change user roles' 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Update user
    await user.update({
      ...(name && { name }),
      ...(email && { email }),
      ...(role && req.user?.role === 'ADMIN' && { role })
    });

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete user (ADMIN only)
router.delete('/:id', authMiddleware, roleGuard(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (req.user?.id === id) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete your own account' 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    await user.destroy();
    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

export default router;
