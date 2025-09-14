import { Router, Request, Response } from 'express';
import { User, RefreshToken } from '../models';
import { JWTUtils } from '../utils/jwt';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'SALES' } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role as 'ADMIN' | 'MANAGER' | 'SALES'
    });

    // Generate tokens
    const tokens = JWTUtils.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Store refresh token
    const refreshTokenRecord = await RefreshToken.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: JWTUtils.getRefreshTokenExpiry()
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Verify password
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate tokens based on remember me preference
    const tokens = rememberMe 
      ? JWTUtils.generateTokenPairWithRememberMe({
          userId: user.id,
          email: user.email,
          role: user.role
        })
      : JWTUtils.generateTokenPair({
          userId: user.id,
          email: user.email,
          role: user.role
        });

    // Store refresh token
    const refreshTokenRecord = await RefreshToken.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: JWTUtils.getRefreshTokenExpiry(rememberMe)
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = JWTUtils.verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
      return;
    }

    // Check if refresh token exists in database
    const refreshTokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken },
      include: [{ model: User, as: 'user' }]
    });

    if (!refreshTokenRecord) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }

    // Check if token is expired
    if (refreshTokenRecord.expiresAt < new Date()) {
      await refreshTokenRecord.destroy();
      res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
      return;
    }

    // Verify user still exists
    const user = refreshTokenRecord.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Generate new access token
    const newAccessToken = JWTUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      await RefreshToken.destroy({
        where: { token: refreshToken }
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

export default router;
