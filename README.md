# CRM System

A full-stack CRM (Customer Relationship Management) system built with Node.js, TypeScript, Next.js, and PostgreSQL. Features advanced real-time collaboration, mobile optimization, and hybrid MQTT + WebSocket architecture for reliable cross-platform communication.

## ✨ Features

### Core CRM Features
- **Lead Management**: Create, update, and track sales leads with status tracking
- **User Management**: Complete user authentication and authorization system
- **Activity Tracking**: Log and monitor customer interactions with detailed history
- **Dashboard**: Analytics and KPI tracking with real-time updates
- **Role-based Access Control**: ADMIN, MANAGER, and SALES roles with granular permissions

### 🚀 Advanced Real-time Features
- **Real-time Collaboration**: WebSocket + MQTT hybrid architecture for reliable real-time communication
- **Collaborative Notes**: Real-time collaborative editing with Y.js and ProseMirror
- **Live Presence**: See who's online and what they're working on
- **Real-time Notifications**: Instant notifications for lead updates, activities, and system events
- **Live Activity Stream**: Real-time activity feed with user presence indicators
- **Mobile-Optimized Realtime**: Enhanced mobile support with MQTT fallback and polling

### 📱 Mobile & Cross-Platform
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Hybrid Transport**: MQTT + Socket.IO + Polling fallback for maximum reliability
- **Mobile Connection Management**: Smart reconnection and queue management for mobile networks
- **Cross-Platform Compatibility**: Works seamlessly on web, Android, and iOS

### 🔧 Technical Features
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Redis Caching**: High-performance caching for improved response times
- **Database Migrations**: Automated database schema management
- **Docker Support**: Complete containerization with Docker Compose
- **TypeScript**: Full type safety across frontend and backend
- **Modern UI**: Beautiful interface built with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware stack
- **Database**: PostgreSQL 12+ with Sequelize ORM
- **Real-time**: Socket.IO + MQTT hybrid architecture
- **Authentication**: JWT with refresh tokens and bcrypt
- **Caching**: Redis for session management and caching
- **Collaboration**: Y.js for real-time collaborative editing
- **Queue Management**: Bull for background job processing
- **Security**: Helmet, CORS, rate limiting, input validation

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: React 18 with Context API
- **Styling**: Tailwind CSS with responsive design
- **Real-time**: Socket.IO client + MQTT WebSocket client
- **Collaborative Editing**: ProseMirror + Y.js integration
- **Charts**: Recharts for analytics and KPIs
- **State Management**: React Context + custom hooks
- **Mobile Optimization**: Custom mobile detection and transport selection

### Infrastructure & DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Database Migrations**: Sequelize CLI with automated migrations
- **Environment Management**: Environment-specific configurations
- **Monitoring**: Winston logging with structured logging
- **Health Checks**: Automated health monitoring endpoints

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mailrevanth07-pixel/crm.git
cd crm
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Backend - create .env file
cp .env.example .env
# Edit .env with your database and Redis configuration

# Frontend - create .env.local file
cp .env.local.example .env.local
# Edit .env.local with your API endpoints
```

4. Set up the database:
```bash
cd backend
npm run migrate
```

5. Create your first user account:
```bash
# You can create users through the API or directly in the database
# The system supports three roles: ADMIN, MANAGER, SALES
```

6. Start the development servers:
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

7. Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/health (health check)

8. Create your first admin user:
```bash
# Using curl (replace with your details)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@yourcompany.com",
    "password": "adminpassword123",
    "role": "ADMIN"
  }'
```

9. Login and start using the CRM system!

## 🤝 Collaborative Features

### Real-time Collaborative Editing
The CRM system includes advanced collaborative editing capabilities powered by Y.js and ProseMirror:

- **Live Collaborative Notes**: Multiple users can edit notes simultaneously with real-time synchronization
- **Cursor Tracking**: See where other users are editing in real-time
- **Conflict Resolution**: Automatic conflict resolution for simultaneous edits
- **Session Management**: Track active collaboration sessions and participants
- **Permission System**: Granular permissions for viewing and editing collaborative content

### Real-time Presence & Activity
- **Live User Presence**: See who's online and what they're working on
- **Activity Indicators**: Real-time indicators showing user activity (viewing, editing, etc.)
- **Lead Viewing**: Track which users are currently viewing specific leads
- **Collaboration Sessions**: Monitor active collaborative editing sessions

### Mobile-Optimized Real-time Communication
- **Hybrid Transport**: MQTT + Socket.IO + Polling fallback for maximum reliability
- **Mobile Detection**: Automatic mobile device detection with optimized settings
- **Smart Reconnection**: Intelligent reconnection logic for mobile networks
- **Queue Management**: Message queuing during network interruptions
- **Background Handling**: Proper behavior when app goes to background/foreground

## 📡 MQTT Integration

### Why MQTT?
The system uses a hybrid MQTT + Socket.IO architecture for better mobile reliability:

- **Better Mobile Support**: MQTT's QoS guarantees work better on mobile networks
- **Cross-Platform**: Native MQTT clients available for Android/iOS
- **Scalable**: Pub/sub architecture scales better than direct WebSocket connections
- **Reliable**: Built-in message persistence and delivery guarantees

### MQTT Setup Options

#### Option 1: Docker (Local Development)
```bash
cd backend
docker-compose up -d mqtt
```

#### Option 2: Cloud MQTT Broker (Production)
- **HiveMQ Cloud**: Free tier available
- **EMQX Cloud**: Free tier available
- **AWS IoT Core**: Enterprise solution

#### Option 3: Self-Hosted
```bash
# Ubuntu/Debian
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

### MQTT Topics Structure
```
crm/
├── leads/{leadId}/created
├── leads/{leadId}/updated
├── leads/{leadId}/assigned
├── activities/{activityId}/created
├── users/{userId}/presence
├── notifications/{notificationId}
└── notes/{noteId}/collaboration
```

## 📱 Mobile Optimization

### Mobile-Specific Features
- **Mobile Detection**: Automatic detection of Android/iOS devices
- **Optimized Transports**: Polling-first approach for better mobile compatibility
- **Extended Timeouts**: Longer timeouts for mobile networks (20s vs 15s)
- **Smart Reconnection**: More aggressive reconnection on mobile devices
- **Queue Management**: Intelligent message queuing during network switches

### Mobile Testing
The system includes comprehensive mobile testing capabilities:

- **Connection Status Panel**: Real-time connection status on mobile devices
- **Debug Information**: Detailed debugging information for troubleshooting
- **Network Switching**: Handles WiFi ↔ Mobile Data transitions gracefully
- **Background/Foreground**: Proper behavior when app goes to background

### Mobile Browser Support
- **Chrome Mobile**: Full support with mobile optimizations
- **Safari iOS**: Optimized for iOS Safari
- **Samsung Internet**: Tested and supported
- **Firefox Mobile**: Compatible with fallback support

## 🚀 Deployment

### Docker Deployment

#### Using Docker Compose (Recommended)

1. **Full Stack with MQTT**:
```bash
# Start all services including MQTT broker
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

2. **Development Mode**:
```bash
# Start with development configuration
docker-compose -f docker-compose.dev.yml up --build
```

3. **Production Mode**:
```bash
# Start with production configuration
docker-compose -f docker-compose.prod.yml up --build
```

4. **Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MQTT Broker: ws://localhost:9001

#### Individual Services

**Backend**:
```bash
cd backend
docker build -t crm-backend .
docker run -p 3001:3001 --env-file .env crm-backend
```

**Frontend**:
```bash
cd frontend
docker build -t crm-frontend .
docker run -p 3000:3000 --env-file .env.local crm-frontend
```

**MQTT Broker**:
```bash
# Using Mosquitto
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto

# Or with configuration
docker run -it -p 1883:1883 -p 9001:9001 -v $(pwd)/mosquitto.conf:/mosquitto/config/mosquitto.conf eclipse-mosquitto
```

### Cloud Deployment

#### Render.com (Recommended)
1. **Backend Deployment**:
   - Connect your GitHub repository
   - Set environment variables (see Environment Variables section)
   - Deploy with Docker

2. **Frontend Deployment**:
   - Deploy to Vercel or Netlify
   - Set environment variables for API endpoints

3. **Database**:
   - Use Render PostgreSQL addon
   - Or external PostgreSQL service

4. **MQTT Broker**:
   - Use HiveMQ Cloud (free tier)
   - Or EMQX Cloud (free tier)

#### AWS Deployment
1. **ECS with Fargate**:
   - Containerized deployment
   - Auto-scaling capabilities
   - Load balancer integration

2. **RDS PostgreSQL**:
   - Managed database service
   - Automated backups
   - High availability

3. **ElastiCache Redis**:
   - Managed Redis service
   - High performance caching

4. **IoT Core MQTT**:
   - Managed MQTT broker
   - Enterprise-grade security

### Mobile App Deployment

#### React Native (Future)
- **Expo**: For rapid development and testing
- **Bare React Native**: For custom native features
- **MQTT Native Client**: Better mobile performance

#### Progressive Web App (PWA)
- **Service Workers**: Offline functionality
- **Push Notifications**: Real-time alerts
- **App-like Experience**: Native feel on mobile

### Production Considerations

#### Security
- **HTTPS/WSS**: Secure connections for all services
- **JWT Secrets**: Use strong, unique secrets
- **Database Security**: Encrypted connections
- **MQTT Security**: TLS/SSL for MQTT connections
- **Rate Limiting**: Prevent abuse and DDoS

#### Performance
- **CDN**: Use CloudFlare or AWS CloudFront
- **Caching**: Redis for session and data caching
- **Database Indexing**: Optimize query performance
- **Connection Pooling**: Efficient database connections
- **Load Balancing**: Distribute traffic across instances

#### Monitoring
- **Health Checks**: Automated service monitoring
- **Logging**: Structured logging with Winston
- **Metrics**: Performance and usage metrics
- **Alerts**: Automated alerting for issues
- **Uptime Monitoring**: Service availability tracking

#### Scaling
- **Horizontal Scaling**: Multiple backend instances
- **Database Scaling**: Read replicas and connection pooling
- **MQTT Clustering**: Multiple MQTT brokers
- **CDN**: Global content delivery
- **Auto-scaling**: Automatic resource adjustment

## User Management & Authentication

### User Roles
The system supports three user roles with different access levels:

- **ADMIN**: Full system access, can manage all users, leads, and activities
- **MANAGER**: Can manage leads and activities, view team performance
- **SALES**: Can manage assigned leads and activities

### User Registration
Users can be created through the registration API endpoint:

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "SALES"  // Optional: defaults to SALES
}
```

### User Login
Users can log in with their email and password:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123",
  "rememberMe": false  // Optional: extends token expiry
}
```

### Authentication Features
- **JWT Tokens**: Secure access and refresh tokens
- **Password Hashing**: Bcrypt encryption for password security
- **Token Refresh**: Automatic token renewal without re-login
- **Remember Me**: Extended session for trusted devices
- **Role-based Access**: Different permissions based on user role

### Creating Your First Admin User
To get started, you'll need to create an admin user. You can do this by:

1. **Using the API directly**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@yourcompany.com",
    "password": "adminpassword123",
    "role": "ADMIN"
  }'
```

2. **Using the frontend registration form** (if available)
3. **Directly in the database** (for development)

### Default Test Credentials
For quick testing and development, you can use these pre-configured accounts:

- **Admin**: admin@crm.com / admin123
- **Manager**: manager@crm.com / manager123
- **Sales Rep**: sales@crm.com / sales123

> **Note**: These are default credentials for development/testing purposes. Make sure to change them in production environments.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get lead by ID
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Activities
- `GET /api/activities` - Get all activities
- `POST /api/activities` - Create new activity
- `GET /api/activities/lead/:leadId` - Get activities for a lead

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Collaborative Notes
- `GET /api/collaborative-notes` - Get all collaborative notes
- `POST /api/collaborative-notes` - Create new collaborative note
- `GET /api/collaborative-notes/:id` - Get collaborative note by ID
- `PUT /api/collaborative-notes/:id` - Update collaborative note
- `DELETE /api/collaborative-notes/:id` - Delete collaborative note
- `POST /api/collaborative-notes/:id/start-session` - Start collaborative session
- `POST /api/collaborative-notes/:id/end-session` - End collaborative session
- `GET /api/collaborative-notes/:id/participants` - Get note participants
- `POST /api/collaborative-notes/:id/share` - Share note with users

### Real-time & Presence
- `GET /api/realtime/status` - Get real-time connection status
- `GET /api/realtime/presence` - Get online users
- `GET /api/realtime/activities` - Get real-time activity stream
- `POST /api/realtime/presence/update` - Update user presence
- `GET /api/realtime/notifications` - Get real-time notifications

### WebSocket Events
- `lead:created` - Lead creation event
- `lead:updated` - Lead update event
- `lead:assigned` - Lead assignment event
- `activity:created` - Activity creation event
- `user:presence` - User presence update
- `note:collaboration` - Collaborative editing event
- `notification:new` - New notification event

## ⚙️ Environment Variables

### Backend (.env)
```bash
# Application Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DATABASE_URL=postgresql://username:password@hostname:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Redis Configuration
REDIS_URL=redis://localhost:6379

# MQTT Configuration (Optional)
MQTT_BROKER_URL=ws://localhost:9001
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# MQTT Configuration (Optional)
NEXT_PUBLIC_MQTT_BROKER_URL=ws://localhost:9001
NEXT_PUBLIC_MQTT_USERNAME=your_mqtt_username
NEXT_PUBLIC_MQTT_PASSWORD=your_mqtt_password

# Real-time Configuration
NEXT_PUBLIC_ENABLE_MQTT=true
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### Production Environment Variables
For production deployment, ensure you have:

```bash
# Required for Production
NODE_ENV=production
DATABASE_URL=postgresql://username:password@hostname:port/database
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com

# Optional for Production
REDIS_URL=redis://your-redis-url
MQTT_BROKER_URL=wss://your-mqtt-broker.com:8884
MQTT_USERNAME=your_production_mqtt_username
MQTT_PASSWORD=your_production_mqtt_password
```

## Database Schema

The system uses the following main entities:

### Users Table
- **id**: UUID primary key
- **name**: User's full name (optional)
- **email**: Unique email address (required)
- **password**: Bcrypt hashed password (required)
- **role**: User role - ADMIN, MANAGER, or SALES (default: SALES)
- **createdAt**: Account creation timestamp
- **updatedAt**: Last update timestamp

### Other Entities
- **Leads**: Sales leads and prospects
- **Activities**: Customer interactions and notes
- **RefreshTokens**: JWT refresh token management
- **CollaborativeNotes**: Real-time collaborative notes
- **UserPresence**: Online user tracking
- **CollaborativeSessions**: Real-time collaboration sessions

## 🧪 Testing & Troubleshooting

### Testing the System

#### 1. Basic Functionality Test
```bash
# Test backend health
curl http://localhost:3001/health

# Test database connection
curl http://localhost:3001/api/auth/profile

# Test MQTT connection (if enabled)
curl http://localhost:3001/api/realtime/status
```

#### 2. Real-time Features Test
1. **Open multiple browser tabs/windows**
2. **Create a lead in one tab**
3. **Verify it appears in other tabs instantly**
4. **Test collaborative notes editing**
5. **Check user presence indicators**

#### 3. Mobile Testing
1. **Open on mobile device**
2. **Check connection status panel**
3. **Test network switching (WiFi ↔ Mobile Data)**
4. **Test background/foreground transitions**
5. **Verify real-time notifications work**

### Common Issues & Solutions

#### Connection Issues
**Problem**: Socket not connecting
**Solutions**:
- Check if backend is running on correct port
- Verify CORS settings
- Check firewall/proxy settings
- Try different transport (polling vs websocket)

#### MQTT Issues
**Problem**: MQTT connection failed
**Solutions**:
- Verify MQTT broker is running
- Check broker URL and credentials
- Ensure WebSocket support is enabled
- Check network connectivity

#### Mobile Issues
**Problem**: Poor mobile performance
**Solutions**:
- Enable MQTT for better mobile reliability
- Check mobile browser compatibility
- Verify mobile-optimized settings are active
- Test with different mobile browsers

#### Database Issues
**Problem**: Database connection failed
**Solutions**:
- Check database credentials
- Verify PostgreSQL is running
- Run database migrations
- Check connection pool settings

### Debug Mode

#### Enable Debug Logging
```bash
# Backend
DEBUG=mqtt*,socket* npm run dev

# Frontend
NEXT_PUBLIC_ENABLE_DEBUG=true npm run dev
```

#### Mobile Debug Panel
On mobile devices, check the debug panel in the bottom-right corner for:
- Connection status
- Transport type
- Queue status
- Mobile detection
- User authentication status

### Performance Monitoring

#### Backend Metrics
- **Response Times**: Monitor API response times
- **Memory Usage**: Track memory consumption
- **Database Queries**: Monitor query performance
- **WebSocket Connections**: Track active connections
- **MQTT Messages**: Monitor message throughput

#### Frontend Metrics
- **Page Load Times**: Monitor initial load performance
- **Real-time Latency**: Track WebSocket/MQTT message latency
- **Mobile Performance**: Monitor mobile-specific metrics
- **Error Rates**: Track client-side errors

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Management
```bash
# Create migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:undo

# Reset database
npm run migrate:sync
```

### Docker Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose logs -f

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 📁 Project Structure

```
crm/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── config/            # Database, Redis, MQTT configuration
│   │   ├── controllers/       # API route controllers
│   │   ├── middleware/        # Authentication, validation, security
│   │   ├── models/           # Sequelize database models
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic services
│   │   ├── socket/           # WebSocket/Socket.IO handlers
│   │   ├── utils/            # Utility functions
│   │   └── validation/       # Input validation schemas
│   ├── migrations/           # Database migrations
│   ├── scripts/              # Setup and utility scripts
│   └── docker-compose.yml    # Docker configuration
├── frontend/                  # Next.js frontend application
│   ├── components/           # React components
│   │   ├── ActivityTimeline.tsx
│   │   ├── CollaborativeNoteEditor.tsx
│   │   ├── LeadCard.tsx
│   │   ├── RealtimeDashboard.tsx
│   │   └── ...               # Other components
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.tsx
│   │   └── SocketContext.tsx
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── api.ts           # API client
│   │   ├── realtimeService.ts
│   │   └── ...              # Other utilities
│   ├── pages/                # Next.js pages
│   │   ├── index.tsx        # Dashboard
│   │   ├── leads/           # Lead management
│   │   ├── activities.tsx   # Activity tracking
│   │   └── auth/            # Authentication pages
│   └── styles/              # CSS and styling
├── Screenshots/              # Application screenshots
├── MQTT_SETUP_GUIDE.md      # MQTT configuration guide
├── MOBILE_TESTING_GUIDE.md  # Mobile testing instructions
├── MQTT_IMPLEMENTATION_SUMMARY.md  # Technical implementation details
└── README.md                # This file
```

### Key Components

#### Backend Components
- **Models**: Database models for Users, Leads, Activities, CollaborativeNotes, etc.
- **Controllers**: Handle HTTP requests and business logic
- **Services**: Background job processing, notifications, MQTT bridge
- **Socket Handlers**: Real-time communication management
- **Middleware**: Authentication, validation, security, error handling

#### Frontend Components
- **CollaborativeNoteEditor**: Real-time collaborative editing with Y.js
- **RealtimeDashboard**: Live activity stream and presence indicators
- **LeadCard**: Lead management with real-time updates
- **ActivityTimeline**: Activity tracking and history
- **ConnectionStatus**: Real-time connection monitoring

#### Real-time Features
- **Socket.IO**: WebSocket communication for web clients
- **MQTT Bridge**: MQTT integration for mobile reliability
- **Y.js Integration**: Collaborative editing capabilities
- **Presence System**: User online/offline tracking
- **Notification System**: Real-time notifications and alerts

## 📚 Additional Resources

### Documentation
- [MQTT Setup Guide](MQTT_SETUP_GUIDE.md) - Complete MQTT configuration
- [Mobile Testing Guide](MOBILE_TESTING_GUIDE.md) - Mobile testing instructions
- [MQTT Implementation Summary](MQTT_IMPLEMENTATION_SUMMARY.md) - Technical details

### External Resources
- [Socket.IO Documentation](https://socket.io/docs/)
- [MQTT Protocol](https://mqtt.org/)
- [Y.js Documentation](https://docs.yjs.dev/)
- [ProseMirror Documentation](https://prosemirror.net/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Sequelize Documentation](https://sequelize.org/)

### Community & Support
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Community discussions and Q&A
- **Documentation**: Comprehensive guides and tutorials
- **Examples**: Code examples and best practices

## License

MIT License - see [LICENSE](LICENSE) file for details.