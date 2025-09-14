# Collaborative Features & Scalability Guide

This document outlines the collaborative features and scalability improvements implemented in the CRM system.

## 🚀 Features Implemented

### 1. **Collaborative Notes System**
- **Real-time Multi-user Editing**: Powered by Y.js and WebSocket
- **Conflict Resolution**: Automatic conflict resolution using Y.js CRDTs
- **User Presence**: See who's currently viewing/editing notes
- **Cursor Tracking**: Real-time cursor positions and selections
- **Version Control**: Track document versions and changes
- **Permissions**: Granular read/edit/delete permissions per user
- **Rich Text Editing**: ProseMirror-based rich text editor

### 2. **Redis Integration**
- **Caching**: High-performance caching for frequently accessed data
- **Pub/Sub**: Real-time event broadcasting across multiple server instances
- **Session Storage**: Store user sessions and temporary data
- **Job Queue**: Background job processing with Bull queue

### 3. **Background Job System**
- **Notification Queue**: Process notifications asynchronously
- **Email Queue**: Send emails in the background
- **Cleanup Jobs**: Automated cleanup of expired data
- **Retry Logic**: Automatic retry with exponential backoff
- **Priority Queues**: Different priority levels for different job types

### 4. **Real-time Notifications**
- **WebSocket Integration**: Real-time notifications via Socket.IO
- **Browser Notifications**: Native browser notifications
- **Notification Center**: Centralized notification management
- **Category Filtering**: Filter notifications by type
- **Read/Unread Status**: Track notification status

### 5. **Socket.IO Scaling**
- **Redis Adapter**: Scale Socket.IO across multiple server instances
- **Room Management**: Efficient room-based messaging
- **Connection Health**: Monitor and manage connections
- **Auto-reconnection**: Client-side reconnection logic

## 🏗️ Architecture

### Backend Services

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Server    │    │   Redis Cache   │    │   Job Queue     │
│   (Express)     │◄──►│   (Caching)     │◄──►│   (Bull/Redis)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Socket.IO     │    │   Pub/Sub       │    │   Notifications │
│   (WebSocket)   │    │   (Events)      │    │   (Background)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │
│   (React/Next)  │
└─────────────────┘
```

### Database Models

#### CollaborativeNote
- **id**: Unique identifier
- **title**: Note title
- **content**: Note content (text)
- **leadId**: Associated lead (optional)
- **createdBy**: Creator user ID
- **updatedBy**: Last updater user ID
- **permissions**: JSON object with canEdit, canView, canDelete arrays
- **metadata**: JSON object with tags, category, priority, dueDate
- **yjsDocument**: Binary Y.js document state
- **version**: Document version number
- **lastModified**: Last modification timestamp

#### UserPresence
- **id**: Unique identifier
- **userId**: User ID
- **resourceType**: Type of resource (note, lead, activity)
- **resourceId**: Resource ID
- **isActive**: Whether user is currently active
- **lastSeen**: Last activity timestamp
- **cursorPosition**: Current cursor position
- **selection**: Current text selection
- **status**: Current status (viewing, editing, idle)
- **metadata**: Additional metadata (user agent, IP, session ID)

#### CollaborativeSession
- **id**: Unique identifier
- **noteId**: Associated note ID
- **sessionId**: Unique session identifier
- **participants**: Array of participant user IDs
- **isActive**: Whether session is active
- **startedAt**: Session start timestamp
- **endedAt**: Session end timestamp
- **lastActivity**: Last activity timestamp
- **yjsUpdates**: Array of Y.js update buffers
- **metadata**: Session statistics

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Docker Services

#### Redis Configuration
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

#### RabbitMQ Configuration (Optional)
```yaml
rabbitmq:
  image: rabbitmq:3-management-alpine
  ports:
    - "5672:5672"   # AMQP port
    - "15672:15672" # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin123
```

## 📱 Frontend Components

### CollaborativeNoteEditor
- **Real-time Editing**: Y.js + ProseMirror integration
- **User Presence**: Show active participants
- **Cursor Tracking**: Real-time cursor positions
- **Auto-save**: Automatic content saving
- **Keyboard Shortcuts**: Ctrl+S to save

### CollaborativeNotesList
- **Note Management**: Create, edit, delete notes
- **Filtering**: Search, priority, category filters
- **Permissions**: View/edit permissions management
- **Tags**: Tag-based organization

### NotificationCenter
- **Real-time Notifications**: WebSocket-based notifications
- **Browser Notifications**: Native browser notifications
- **Filtering**: Category and read status filters
- **Mark as Read**: Individual and bulk read status

## 🚀 Getting Started

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Start Services

#### Development (with Docker)
```bash
# Start all services
docker-compose -f docker-compose.full.yml up --build

# Or start with RabbitMQ
docker-compose -f docker-compose.full.yml --profile rabbitmq up --build
```

#### Development (Local)
```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Start Backend
cd backend
npm run dev

# Start Frontend
cd frontend
npm run dev
```

### 3. Database Setup

```bash
cd backend
npm run migrate:sync
npm run setup
```

## 🔄 API Endpoints

### Collaborative Notes

#### Create Note
```http
POST /api/collaborative-notes
Content-Type: application/json

{
  "title": "Note Title",
  "content": "Note content",
  "leadId": "optional-lead-id",
  "permissions": {
    "canEdit": ["user-id-1", "user-id-2"],
    "canView": ["user-id-3"],
    "canDelete": ["user-id-1"]
  },
  "metadata": {
    "tags": ["tag1", "tag2"],
    "category": "meeting",
    "priority": "high",
    "dueDate": "2024-01-01"
  }
}
```

#### Get Note
```http
GET /api/collaborative-notes/:id
```

#### Update Note
```http
PUT /api/collaborative-notes/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "permissions": { ... },
  "metadata": { ... }
}
```

#### Delete Note
```http
DELETE /api/collaborative-notes/:id
```

#### Get User Notes
```http
GET /api/collaborative-notes?leadId=optional&page=1&limit=20
```

#### Start Collaborative Session
```http
POST /api/collaborative-notes/sessions/start
Content-Type: application/json

{
  "noteId": "note-id"
}
```

#### End Collaborative Session
```http
POST /api/collaborative-notes/sessions/end
Content-Type: application/json

{
  "noteId": "note-id"
}
```

#### Apply Y.js Update
```http
POST /api/collaborative-notes/:id/yjs-update
Content-Type: application/json

{
  "update": "base64-encoded-yjs-update"
}
```

### Notifications

#### Get User Notifications
```http
GET /api/notifications?limit=50
```

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/mark-all-read
```

## 🔧 WebSocket Events

### Client to Server

#### Join Note
```javascript
socket.emit('note:join', { noteId: 'note-id' });
```

#### Leave Note
```javascript
socket.emit('note:leave', { noteId: 'note-id' });
```

#### Update Cursor Position
```javascript
socket.emit('note:cursor', { 
  noteId: 'note-id', 
  position: { line: 10, column: 5 } 
});
```

### Server to Client

#### New Notification
```javascript
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

#### User Joined Note
```javascript
socket.on('note:user-joined', (data) => {
  console.log('User joined:', data.user);
});
```

#### User Left Note
```javascript
socket.on('note:user-left', (data) => {
  console.log('User left:', data.userId);
});
```

#### Cursor Update
```javascript
socket.on('note:cursor-update', (data) => {
  console.log('Cursor update:', data);
});
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Test collaborative editing
npm run test:collaborative

# Test notifications
npm run test:notifications

# Test job queue
npm run test:jobs
```

## 📊 Monitoring

### Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli

# Monitor commands
MONITOR

# Check memory usage
INFO memory

# Check connected clients
CLIENT LIST
```

### Job Queue Monitoring
```bash
# Check queue stats
curl http://localhost:3001/api/queue-stats

# Check job status
curl http://localhost:3001/api/jobs/:jobId
```

### Socket.IO Monitoring
```bash
# Check connection stats
curl http://localhost:3001/socket-stats

# Check health
curl http://localhost:3001/socket-status
```

## 🚨 Troubleshooting

### Common Issues

#### Redis Connection Failed
- Check if Redis is running: `docker ps | grep redis`
- Verify Redis URL in environment variables
- Check Redis logs: `docker logs crm-redis`

#### WebSocket Connection Issues
- Check if Socket.IO server is running
- Verify CORS settings
- Check browser console for errors
- Test with: `curl http://localhost:3001/socket-status`

#### Y.js Sync Issues
- Check WebSocket connection
- Verify note permissions
- Check browser console for Y.js errors
- Try refreshing the page

#### Job Queue Not Processing
- Check Redis connection
- Verify job queue is initialized
- Check job queue logs
- Monitor queue stats

### Performance Optimization

#### Redis Optimization
- Set appropriate memory limits
- Use Redis persistence (AOF)
- Monitor memory usage
- Use Redis clustering for high availability

#### Database Optimization
- Add appropriate indexes
- Use connection pooling
- Monitor query performance
- Use read replicas for scaling

#### Frontend Optimization
- Use React.memo for components
- Implement virtual scrolling for large lists
- Use Web Workers for heavy computations
- Optimize bundle size

## 🔒 Security Considerations

### Authentication
- JWT tokens for API authentication
- WebSocket authentication middleware
- Token refresh mechanism
- Secure token storage

### Authorization
- Role-based access control
- Resource-level permissions
- API endpoint protection
- WebSocket room access control

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Network Security
- HTTPS/WSS for production
- CORS configuration
- Rate limiting
- DDoS protection

## 📈 Scaling Considerations

### Horizontal Scaling
- Multiple server instances
- Load balancer configuration
- Redis clustering
- Database read replicas

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use connection pooling
- Implement caching strategies

### Monitoring and Alerting
- Application performance monitoring
- Error tracking and logging
- Resource usage monitoring
- Automated alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation
- Contact the development team
