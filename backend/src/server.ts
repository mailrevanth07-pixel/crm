import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { sequelize } from './models';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import leadRoutes from './routes/leads';
import activityRoutes from './routes/activities';
import collaborativeNotesRoutes from './routes/collaborativeNotes';
import { authMiddleware, roleGuard, AuthenticatedRequest } from './middleware/auth';
import { SocketHandler } from './socket/socketHandler';
import { redisService } from './config/redis';
import { jobQueueService } from './services/jobQueue';
import logger from './config/logger';
import { 
  securityHeaders, 
  generalLimiter, 
  authLimiter, 
  speedLimiter, 
  requestLogger, 
  errorLogger 
} from './middleware/security';
import { 
  errorHandler, 
  notFound, 
  handleUnhandledRejection, 
  handleUncaughtException 
} from './middleware/errorHandler';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.IO
const socketHandler = new SocketHandler(server);
app.set('socketHandler', socketHandler);
app.set('io', socketHandler.getIO());

// Initialize job queue service
jobQueueService.setSocketHandler(socketHandler);

// Start health monitoring
socketHandler.startHealthMonitoring();

// Initialize error handlers
handleUnhandledRejection();
handleUncaughtException();

// Security middleware (must be first)
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(generalLimiter);
app.use(speedLimiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM Backend is running' });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'OK', message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'Database connection failed', error });
  }
});

// Socket.IO status endpoint
app.get('/socket-status', (req, res) => {
  const stats = socketHandler.getConnectionStats();
  
  res.json({
    status: 'OK',
    message: 'Socket.IO is running',
    ...stats
  });
});

// Enhanced socket management endpoints
app.get('/socket-stats', (req, res) => {
  const stats = socketHandler.getConnectionStats();
  res.json({
    success: true,
    data: stats
  });
});

// Force disconnect user endpoint (admin only)
app.post('/socket/disconnect-user', authMiddleware, roleGuard(['ADMIN']), (req: AuthenticatedRequest, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }
  
  socketHandler.disconnectUser(userId);
  
  return res.json({
    success: true,
    message: `User ${userId} disconnected successfully`
  });
});

// Broadcast maintenance message (admin only)
app.post('/socket/broadcast', authMiddleware, roleGuard(['ADMIN']), (req: AuthenticatedRequest, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    });
  }
  
  socketHandler.broadcastMaintenance(message);
  
  return res.json({
    success: true,
    message: 'Maintenance message broadcasted successfully'
  });
});

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/collaborative-notes', collaborativeNotesRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    message: 'This is a protected route',
    user: req.user 
  });
});

// Admin only route example
app.get('/api/admin-only', authMiddleware, roleGuard(['ADMIN']), (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    message: 'This is an admin-only route',
    user: req.user 
  });
});

// Manager and Admin route example
app.get('/api/management', authMiddleware, roleGuard(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    message: 'This is a management route',
    user: req.user 
  });
});

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(notFound);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize Redis connection
    try {
      await redisService.connect();
      console.log('✅ Redis connected, initializing job queues...');
      // Initialize job queue and schedule recurring jobs
      try {
        jobQueueService.scheduleRecurringJobs();
        console.log('✅ Job queues initialized successfully');
      } catch (jobQueueError) {
        console.warn('⚠️  Job queue initialization failed:', jobQueueError);
      }
    } catch (redisError) {
      console.warn('⚠️  Redis connection failed, continuing without Redis:', redisError);
    }

    // Initialize database connection
    console.log('🔄 Connecting to database...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      console.error('Database URL being used:', process.env.DATABASE_URL);
      throw dbError;
    }
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Please kill the process using this port or use a different port.`);
        logger.error(`To find and kill the process: netstat -ano | findstr :${PORT}`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
