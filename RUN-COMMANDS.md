# CRM Application - Run Commands Guide

This guide provides commands to run both the frontend and backend locally and with Docker, using a cloud database.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose
- A cloud PostgreSQL database (Render, Neon, Supabase, Railway, etc.)

## Environment Setup

### 1. Backend Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Cloud Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Redis Configuration (Required for collaborative features)
REDIS_URL=redis://localhost:6379
```

### 2. Frontend Environment Configuration

The frontend will automatically connect to the backend at `http://localhost:3001`.

## Local Development (Without Docker)

### Backend Setup and Run

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your cloud database configuration
# (Copy the example above and update with your database details)

# Run database migrations and setup
npm run migrate:sync

# Start the development server
npm run dev
```

The backend will be available at `http://localhost:3001`

### Frontend Setup and Run

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Docker Development (Recommended)

### Option 1: Backend with Docker, Frontend Local

```bash
# Start only the backend with Docker (using cloud database)
cd backend
docker-compose -f docker-compose.dev.yml up --build

# In another terminal, start frontend locally
cd frontend
npm install
npm run dev
```

### Option 2: Both Backend and Frontend with Docker (Full Stack)

```bash
# From the root directory - Start both services with Docker
docker-compose -f docker-compose.full.yml up --build

# Or using the Makefile
make dev

# Or using npm scripts from backend directory
cd backend
npm run docker:full:dev
```

### Option 3: Individual Services with Docker

```bash
# Start only backend with Docker
make backend-only

# Start only frontend with Docker
make frontend-only
```

## Production with Docker

### Full Stack Production

```bash
# From the root directory - Start both services in production
docker-compose -f docker-compose.prod.full.yml up --build -d

# Or using the Makefile
make prod

# Or using npm scripts from backend directory
cd backend
npm run docker:full:prod
```

### Individual Production Services

```bash
# Backend only
cd backend
docker-compose -f docker-compose.prod.yml up --build -d

# Frontend only
cd frontend
npm run build
npm start
```

## Quick Start Commands

### Using Makefile (Full Stack)

```bash
# From the root directory

# Show all available commands
make help

# Start full stack development environment
make dev

# Start full stack production environment
make prod

# Stop all services
make down

# View logs
make logs

# Access container shells
make shell-backend
make shell-frontend

# Run database migrations
make migrate

# Setup database (migrate + seed)
make setup

# Check service health
make health
```

### Using Makefile (Backend only)

```bash
cd backend

# Show all available commands
make help

# Start development environment
make dev

# Start production environment
make prod

# Stop all services
make down

# View logs
make logs-dev

# Access container shell
make shell-dev

# Run database migrations
make migrate-dev

# Setup database (migrate + seed)
make setup-dev
```

### Using npm scripts

#### Backend Commands

```bash
cd backend

# Development
npm run dev                    # Start development server
npm run build                  # Build TypeScript
npm run start                  # Start production server
npm run migrate:sync          # Sync database schema
npm run setup                 # Setup database with sample data

# Docker Development
npm run docker:dev            # Start development with Docker
npm run docker:build:dev      # Build development Docker image
npm run docker:logs:dev       # View development logs
npm run docker:shell:dev      # Access development container shell

# Docker Production
npm run docker:prod           # Start production with Docker
npm run docker:build          # Build production Docker image
npm run docker:logs           # View production logs
npm run docker:shell          # Access production container shell

# Database
npm run migrate               # Run migrations
npm run migrate:undo          # Undo last migration
npm run seed:run              # Run seed script
npm run setup                 # Full database setup
```

#### Frontend Commands

```bash
cd frontend

# Development
npm run dev                   # Start development server
npm run build                 # Build for production
npm run start                 # Start production server
npm run lint                  # Run linter
```

## Database Management

### Cloud Database Setup

1. **Sign up for a cloud PostgreSQL service:**
   - [Render](https://render.com) (Free tier available)
   - [Neon](https://neon.tech) (Free tier available)
   - [Supabase](https://supabase.com) (Free tier available)
   - [Railway](https://railway.app) (Free tier available)

2. **Get your connection string:**
   - Format: `postgresql://username:password@host:port/database?sslmode=require`
   - Update the `DATABASE_URL` in your `.env` file

3. **Run database setup:**
   ```bash
   cd backend
   npm run migrate:sync
   npm run setup
   ```

### Database Commands

```bash
# Sync database schema (development)
npm run migrate:sync

# Run migrations (production)
npm run migrate

# Setup database with sample data
npm run setup

# Access database shell (Docker)
make shell-db

# Backup database (Docker)
make backup-db

# Restore database (Docker)
make restore-db BACKUP_FILE=backup.sql
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   - Verify your `DATABASE_URL` is correct
   - Ensure your cloud database is accessible
   - Check if SSL mode is required (`?sslmode=require`)

2. **Port Conflicts:**
   - Backend runs on port 3001
   - Frontend runs on port 3000
   - Change ports in `.env` if needed

3. **Docker Issues:**
   - Ensure Docker is running
   - Try rebuilding containers: `docker-compose up --build`
   - Check logs: `docker-compose logs -f`

4. **Permission Issues:**
   - On Windows, ensure Docker Desktop has proper permissions
   - On Linux/Mac, you might need `sudo` for some Docker commands

### Health Checks

```bash
# Check backend health
curl http://localhost:3001/health

# Check socket status
curl http://localhost:3001/socket-status

# Check frontend
curl http://localhost:3000
```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Cloud database connection string | `postgresql://user:pass@host:port/db?sslmode=require` |
| `JWT_SECRET` | JWT signing secret | `your_jwt_secret_key_here` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `your_jwt_refresh_secret_key_here` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Backend port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `REDIS_URL` | Redis connection (optional) | `redis://localhost:6379` |

### Frontend

The frontend automatically connects to `http://localhost:3001` for the backend API.

## Collaborative Features

The CRM now includes advanced collaborative features:

### 🚀 **Real-time Collaborative Notes**
- **Multi-user editing** with Y.js conflict resolution
- **User presence** tracking and cursor sharing
- **Rich text editing** with ProseMirror
- **Version control** and change tracking
- **Granular permissions** per user

### 📡 **Real-time Notifications**
- **WebSocket-based** notifications
- **Browser notifications** with permission handling
- **Background job processing** with Redis/Bull
- **Notification center** with filtering

### ⚡ **Scalable Architecture**
- **Redis caching** and pub/sub messaging
- **Socket.IO scaling** across multiple instances
- **Background job queues** for async processing
- **Health monitoring** and connection management

### 🎯 **Getting Started with Collaborative Features**

1. **Start Redis** (required for collaborative features):
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Run database migrations** for new tables:
   ```bash
   cd backend
   npm run migrate
   ```

3. **Test collaborative features**:
   ```bash
   node test-collaborative-features.js
   ```

## Default Admin User

After running the setup, you can log in with:
- **Email:** admin@example.com
- **Password:** Admin123

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure cloud database is accessible
4. Check port availability
