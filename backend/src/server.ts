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
import realtimeRoutes from './routes/realtime';
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

// CORS Configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    console.log('CORS check:', { origin, hasOrigin: !!origin });
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000',
      'https://crm-ten-dusky.vercel.app' // Add Vercel URL
    ].filter(Boolean); // Remove undefined values
    
    console.log('CORS: Allowed origins:', allowedOrigins);
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      console.log('CORS: Origin allowed in list:', origin);
      callback(null, true);
    } else if (origin && origin.includes('.vercel.app')) {
      // Allow all Vercel subdomains
      console.log('CORS: Origin allowed as Vercel subdomain:', origin);
      callback(null, true);
    } else {
      console.log('CORS: Origin blocked:', origin);
      console.log('CORS: Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Additional CORS middleware as fallback
app.use((req, res, next) => {
  const origin = req.get('Origin');
  console.log('Additional CORS middleware:', { origin, method: req.method });
  
  if (origin && (origin.includes('.vercel.app') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  }
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM Backend is running' });
});

// CORS debug endpoint
app.get('/cors-debug', (req, res) => {
  res.json({
    status: 'OK',
    origin: req.get('Origin'),
    headers: req.headers,
    allowedOrigins: [
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      'http://localhost:3000',
      'https://localhost:3000'
    ].filter(Boolean)
  });
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
app.use('/api/realtime', realtimeRoutes);

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
    
    // Log environment variables for debugging
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      DB_HOST: process.env.DB_HOST || 'Not set',
      DB_PORT: process.env.DB_PORT || 'Not set',
      DB_NAME: process.env.DB_NAME || 'Not set',
      DB_USER: process.env.DB_USER || 'Not set',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'Set' : 'Not set'
    });
    
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      console.error('Database URL being used:', process.env.DATABASE_URL);
      console.error('Fallback config being used:', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'crm_db',
        username: process.env.DB_USER || 'postgres',
        hasPassword: !!process.env.DB_PASSWORD
      });
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
