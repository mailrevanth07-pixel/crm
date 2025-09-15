import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { redisService } from '../config/redis';
import { MQTTBridge } from '../services/mqttBridge';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name?: string;
    email: string;
    role: string;
  };
}

export class SocketHandler {
  private io: SocketIOServer;
  private mqttBridge: MQTTBridge;

  constructor(server: HTTPServer) {
    const ioConfig: any = {
      cors: {
        origin: function (origin: string | undefined, callback: Function) {
          // Allow requests with no origin (mobile apps, Postman, etc.)
          if (!origin) return callback(null, true);
          
          const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.CORS_ORIGIN,
            'http://localhost:3000',
            'https://localhost:3000',
            'http://127.0.0.1:3000',
            'https://127.0.0.1:3000',
            'https://crm-ten-dusky.vercel.app', // Add Vercel URL
            'https://*.vercel.app' // Allow all Vercel subdomains
          ].filter(Boolean);
          
          // Check exact match first
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else if (origin && origin.includes('.vercel.app')) {
            // Allow all Vercel subdomains
            callback(null, true);
          } else {
            console.log('Socket CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ["GET", "POST"],
        credentials: true
      },
      // Ultra-conservative mobile configuration
      pingTimeout: 300000, // 5 minutes - very conservative
      pingInterval: 60000, // 1 minute - less frequent pings
      upgradeTimeout: 30000, // 30 seconds - longer upgrade timeout
      allowEIO3: true, // Allow Engine.IO v3 clients (older mobile browsers)
      // Disable upgrades completely for mobile compatibility
      allowUpgrades: false,
      // Conservative connection settings
      maxHttpBufferSize: 1e6, // 1MB buffer
      // Add mobile-specific options
      transports: ['polling'], // Force polling only
      // Increase timeouts for mobile networks
      connectTimeout: 60000, // 60 seconds
      // Add heartbeat settings
      heartbeatTimeout: 300000, // 5 minutes
      heartbeatInterval: 60000, // 1 minute
    };

    // Add Redis adapter if Redis is available
    const redisAdapter = redisService.getSocketIOAdapter();
    if (redisAdapter) {
      try {
        ioConfig.adapter = redisAdapter;
        console.log('✅ Redis adapter configured for Socket.IO');
      } catch (error) {
        console.warn('Failed to configure Redis adapter, using default:', error);
      }
    } else {
      console.log('⚠️  Redis not available, using default Socket.IO adapter');
    }

    this.io = new SocketIOServer(server, ioConfig);
    this.mqttBridge = new MQTTBridge(this.io);
    this.setupMiddleware();
    this.setupEventHandlers();
    this.initializeMQTTBridge();
  }

  private async initializeMQTTBridge(): Promise<void> {
    try {
      await this.mqttBridge.initialize();
      console.log('✅ MQTT Bridge initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MQTT Bridge:', error);
      // Continue without MQTT - system will work with Socket.IO only
    }
  }

  private setupMiddleware(): void {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        // Get token from auth payload or Authorization header
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          console.error('Socket connection rejected: No token provided');
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Verify user still exists
        const user = await User.findByPk(decoded.id || decoded.userId);
        if (!user) {
          console.error('Socket connection rejected: User not found', decoded.id || decoded.userId);
          return next(new Error('User not found'));
        }

        // Attach user info to socket
        (socket as AuthenticatedSocket).user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        if (error instanceof jwt.JsonWebTokenError) {
          return next(new Error('Invalid authentication token'));
        } else if (error instanceof jwt.TokenExpiredError) {
          return next(new Error('Authentication token expired'));
        } else {
          return next(new Error('Authentication failed'));
        }
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`New socket connection: ${socket.id}`, {
        user: socket.user?.email,
        userAgent: socket.handshake.headers['user-agent'],
        origin: socket.handshake.headers.origin,
        transport: socket.conn.transport.name,
        timestamp: new Date().toISOString(),
        remoteAddress: socket.handshake.address,
        secure: socket.handshake.secure
      });

      // Track connection time
      (socket as any).connectedAt = Date.now();

      // Join user to their personal room and global org room
      if (socket.user) {
        socket.join(`user:${socket.user.id}`);
        socket.join('org:global');
        
        // Emit user online event
        this.emitUserOnline(socket.user);
      }

      // Handle lead subscription
      socket.on('lead:subscribe', (data: { leadId: string }) => {
        try {
          if (!data || !data.leadId) {
            socket.emit('error', { message: 'Lead ID is required' });
            return;
          }
          
          socket.join(`lead:${data.leadId}`);
          socket.emit('lead:subscribed', { leadId: data.leadId });
        } catch (error) {
          console.error('Error in lead subscription:', error);
          socket.emit('error', { message: 'Failed to subscribe to lead' });
        }
      });

      // Handle lead unsubscription
      socket.on('lead:unsubscribe', (data: { leadId: string }) => {
        try {
          if (!data || !data.leadId) {
            socket.emit('error', { message: 'Lead ID is required' });
            return;
          }
          
          socket.leave(`lead:${data.leadId}`);
          socket.emit('lead:unsubscribed', { leadId: data.leadId });
        } catch (error) {
          console.error('Error in lead unsubscription:', error);
          socket.emit('error', { message: 'Failed to unsubscribe from lead' });
        }
      });

      // Handle collaborative note subscription
      socket.on('note:subscribe', (data: { noteId: string }) => {
        try {
          if (!data || !data.noteId) {
            socket.emit('error', { message: 'Note ID is required' });
            return;
          }
          
          socket.join(`note:${data.noteId}`);
          socket.emit('note:subscribed', { noteId: data.noteId });
        } catch (error) {
          console.error('Error in note subscription:', error);
          socket.emit('error', { message: 'Failed to subscribe to note' });
        }
      });

      // Handle collaborative note unsubscription
      socket.on('note:unsubscribe', (data: { noteId: string }) => {
        try {
          if (!data || !data.noteId) {
            socket.emit('error', { message: 'Note ID is required' });
            return;
          }
          
          socket.leave(`note:${data.noteId}`);
          socket.emit('note:unsubscribed', { noteId: data.noteId });
        } catch (error) {
          console.error('Error in note unsubscription:', error);
          socket.emit('error', { message: 'Failed to unsubscribe from note' });
        }
      });

      // Handle collaborative note cursor updates
      socket.on('note:cursor', (data: { noteId: string; position: { line: number; column: number } }) => {
        try {
          if (!data || !data.noteId || !data.position) {
            socket.emit('error', { message: 'Note ID and position are required' });
            return;
          }
          
          // Broadcast cursor position to other users in the note room
          socket.to(`note:${data.noteId}`).emit('note:cursor-update', {
            userId: socket.user?.id,
            user: socket.user,
            position: data.position,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error in note cursor update:', error);
          socket.emit('error', { message: 'Failed to update cursor position' });
        }
      });

      // Handle collaborative note selection updates
      socket.on('note:selection', (data: { noteId: string; selection: { start: { line: number; column: number }; end: { line: number; column: number } } }) => {
        try {
          if (!data || !data.noteId || !data.selection) {
            socket.emit('error', { message: 'Note ID and selection are required' });
            return;
          }
          
          // Broadcast selection to other users in the note room
          socket.to(`note:${data.noteId}`).emit('note:selection-update', {
            userId: socket.user?.id,
            user: socket.user,
            selection: data.selection,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error in note selection update:', error);
          socket.emit('error', { message: 'Failed to update selection' });
        }
      });

      // Handle collaborative note Y.js updates
      socket.on('note:yjs-update', (data: { noteId: string; update: string }) => {
        try {
          if (!data || !data.noteId || !data.update) {
            socket.emit('error', { message: 'Note ID and update are required' });
            return;
          }
          
          // Broadcast Y.js update to other users in the note room
          socket.to(`note:${data.noteId}`).emit('note:yjs-update', {
            userId: socket.user?.id,
            update: data.update,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error in note Y.js update:', error);
          socket.emit('error', { message: 'Failed to broadcast Y.js update' });
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle test connection
      socket.on('test_connection', (data) => {
        console.log('Test connection received:', data);
        socket.emit('test_response', {
          success: true,
          timestamp: Date.now(),
          receivedData: data,
          socketId: socket.id
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id}`, {
          user: socket.user?.email,
          reason,
          transport: socket.conn.transport.name,
          timestamp: new Date().toISOString(),
          duration: Date.now() - (socket as any).connectedAt
        });
        
        // Emit user offline event
        if (socket.user) {
          this.emitUserOffline(socket.user.id);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.user?.email}:`, error);
      });

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected successfully',
        userId: socket.user?.id,
        userRole: socket.user?.role,
        timestamp: new Date().toISOString()
      });
    });

    // Handle connection errors
    this.io.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
  }

  // Emit events to specific rooms
  public emitToLead(leadId: string, event: string, data: any): void {
    this.io.to(`lead:${leadId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToOrg(event: string, data: any): void {
    this.io.to('org:global').emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public emitToNote(noteId: string, event: string, data: any): void {
    this.io.to(`note:${noteId}`).emit(event, data);
  }

  // Specific event emitters for lead operations
  public emitLeadCreated(lead: any, createdBy: any): void {
    const eventData = {
      lead,
      createdBy,
      timestamp: new Date().toISOString()
    };
    
    // Emit to global org room
    this.emitToOrg('lead:created', eventData);
    
    // Publish to MQTT
    this.mqttBridge.publishLeadEvent(lead.id, 'created', eventData, createdBy.id);
  }

  public emitLeadUpdated(lead: any, updatedBy: any): void {
    const eventData = {
      lead,
      updatedBy,
      timestamp: new Date().toISOString()
    };
    
    // Emit to both lead-specific room and global org room
    this.emitToLead(lead.id, 'lead:updated', eventData);
    this.emitToOrg('lead:updated', eventData);
    
    // Publish to MQTT
    this.mqttBridge.publishLeadEvent(lead.id, 'updated', eventData, updatedBy.id);
  }

  public emitLeadDeleted(leadId: string, deletedBy: any): void {
    const eventData = {
      leadId,
      deletedBy,
      timestamp: new Date().toISOString()
    };
    
    // Emit to both lead-specific room and global org room
    this.emitToLead(leadId, 'lead:deleted', eventData);
    this.emitToOrg('lead:deleted', eventData);
  }

  public emitLeadAssigned(lead: any, previousOwnerId: string | null, assignedBy: any): void {
    const eventData = {
      lead,
      previousOwnerId,
      assignedBy,
      timestamp: new Date().toISOString()
    };
    
    // Emit to both lead-specific room and global org room
    this.emitToLead(lead.id, 'lead:assigned', eventData);
    this.emitToOrg('lead:assigned', eventData);
    
    // Publish to MQTT
    this.mqttBridge.publishLeadEvent(lead.id, 'assigned', eventData, assignedBy.id);
  }

  public emitActivityCreated(activity: any, leadId: string, createdBy: any): void {
    const eventData = {
      activity,
      leadId,
      createdBy,
      timestamp: new Date().toISOString()
    };
    
    // Emit to lead-specific room and global org room
    this.emitToLead(leadId, 'activity:created', eventData);
    this.emitToOrg('activity:created', eventData);
    
    // Publish to MQTT
    this.mqttBridge.publishActivityEvent(activity.id, 'created', eventData, createdBy.id);
  }

  public emitActivityUpdated(activity: any, leadId: string, updatedBy: any): void {
    const eventData = {
      activity,
      leadId,
      updatedBy,
      timestamp: new Date().toISOString()
    };
    
    this.emitToLead(leadId, 'activity:updated', eventData);
    this.emitToOrg('activity:updated', eventData);
  }

  public emitActivityDeleted(activityId: string, leadId: string, deletedBy: any): void {
    const eventData = {
      activityId,
      leadId,
      deletedBy,
      timestamp: new Date().toISOString()
    };
    
    this.emitToLead(leadId, 'activity:deleted', eventData);
    this.emitToOrg('activity:deleted', eventData);
  }

  // Collaborative note events
  public emitNoteCreated(note: any, createdBy: any): void {
    const eventData = {
      note,
      createdBy,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(note.id, 'note:created', eventData);
    this.emitToOrg('note:created', eventData);
  }

  public emitNoteUpdated(note: any, updatedBy: any): void {
    const eventData = {
      note,
      updatedBy,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(note.id, 'note:updated', eventData);
    this.emitToOrg('note:updated', eventData);
  }

  public emitNoteDeleted(noteId: string, deletedBy: any): void {
    const eventData = {
      noteId,
      deletedBy,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(noteId, 'note:deleted', eventData);
    this.emitToOrg('note:deleted', eventData);
  }

  public emitNoteShared(note: any, sharedBy: any, sharedWith: any[]): void {
    const eventData = {
      note,
      sharedBy,
      sharedWith,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(note.id, 'note:shared', eventData);
    this.emitToOrg('note:shared', eventData);
  }

  public emitUserJoinedNote(noteId: string, user: any): void {
    const eventData = {
      noteId,
      user,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(noteId, 'note:user-joined', eventData);
  }

  public emitUserLeftNote(noteId: string, userId: string): void {
    const eventData = {
      noteId,
      userId,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(noteId, 'note:user-left', eventData);
  }

  public emitNoteCursorUpdate(noteId: string, userId: string, user: any, position: any): void {
    const eventData = {
      noteId,
      userId,
      user,
      position,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(noteId, 'note:cursor-update', eventData);
  }

  public emitNoteSelectionUpdate(noteId: string, userId: string, user: any, selection: any): void {
    const eventData = {
      noteId,
      userId,
      user,
      selection,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(noteId, 'note:selection-update', eventData);
  }

  public emitNoteYjsUpdate(noteId: string, userId: string, update: string): void {
    const eventData = {
      noteId,
      userId,
      update,
      timestamp: new Date().toISOString()
    };
    
    this.emitToNote(noteId, 'note:yjs-update', eventData);
  }

  // User presence events
  public emitUserOnline(user: any): void {
    const eventData = {
      user,
      timestamp: new Date().toISOString()
    };
    
    this.emitToOrg('user:online', eventData);
    
    // Publish to MQTT
    this.mqttBridge.publishPresenceEvent(user.id, 'online', eventData);
  }

  public emitUserOffline(userId: string): void {
    const eventData = {
      userId,
      timestamp: new Date().toISOString()
    };
    
    this.emitToOrg('user:offline', eventData);
    
    // Publish to MQTT
    this.mqttBridge.publishPresenceEvent(userId, 'offline', eventData);
  }

  public emitUserViewingLead(user: any, leadId: string): void {
    const eventData = {
      user,
      leadId,
      timestamp: new Date().toISOString()
    };
    
    this.emitToLead(leadId, 'user:viewing_lead', eventData);
    this.emitToOrg('user:viewing_lead', eventData);
  }

  public emitUserStoppedViewingLead(userId: string, leadId: string): void {
    const eventData = {
      userId,
      leadId,
      timestamp: new Date().toISOString()
    };
    
    this.emitToLead(leadId, 'user:stopped_viewing_lead', eventData);
    this.emitToOrg('user:stopped_viewing_lead', eventData);
  }

  // Stats updates
  public emitStatsUpdate(stats: any): void {
    this.emitToOrg('stats:update', {
      ...stats,
      timestamp: new Date().toISOString()
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.io.engine.clientsCount;
  }

  // Get users in a specific room
  public getUsersInRoom(room: string): number {
    const roomSet = this.io.sockets.adapter.rooms.get(room);
    return roomSet ? roomSet.size : 0;
  }

  // Start connection health monitoring
  public startHealthMonitoring(): void {
    setInterval(() => {
      const connectedSockets = this.io.sockets.sockets.size;
      const orgUsers = this.getUsersInRoom('org:global');
      
      
      // Emit health status to all connected clients
      this.io.emit('health:status', {
        connectedSockets,
        orgUsers,
        timestamp: new Date().toISOString()
      });
    }, 30000); // Check every 30 seconds
  }

  // Get detailed connection statistics
  public getConnectionStats(): any {
    const connectedSockets = this.io.sockets.sockets.size;
    const orgUsers = this.getUsersInRoom('org:global');
    
    // Get room statistics
    const rooms = Array.from(this.io.sockets.adapter.rooms.keys());
    const leadRooms = rooms.filter(room => room.startsWith('lead:'));
    const userRooms = rooms.filter(room => room.startsWith('user:'));
    
    return {
      connectedSockets,
      orgUsers,
      totalRooms: rooms.length,
      leadRooms: leadRooms.length,
      userRooms: userRooms.length,
      timestamp: new Date().toISOString()
    };
  }

  // Force disconnect a specific user
  public disconnectUser(userId: string): void {
    const userRoom = `user:${userId}`;
    const room = this.io.sockets.adapter.rooms.get(userRoom);
    
    if (room) {
      room.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      });
    }
  }

  // Broadcast maintenance message
  public broadcastMaintenance(message: string): void {
    this.io.emit('maintenance:notice', {
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Cleanup method
  public async cleanup(): Promise<void> {
    if (this.mqttBridge) {
      await this.mqttBridge.cleanup();
    }
  }
}
