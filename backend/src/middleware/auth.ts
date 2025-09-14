import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { User } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = JWTUtils.verifyAccessToken(token);
      
      // Verify user still exists
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
        return;
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired access token' 
      });
      return;
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

export const roleGuard = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
      return;
    }

    next();
  };
};
