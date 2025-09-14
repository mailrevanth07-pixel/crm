# Docker Setup Guide

This guide explains how to run the CRM backend using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd backend
cp env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Required settings
DATABASE_URL=postgresql://crm_user:crm_password@postgres:5432/crm_db
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_here
```

### 3. Run with Docker Compose

```bash
# Development (with hot reload)
npm run docker:dev

# Production
npm run docker:prod
```

## Available Services

### Production Services
- **backend**: Node.js API server
- **postgres**: PostgreSQL 15 database
- **redis**: Redis 7 (optional, for Socket.IO scaling)

### Development Services
- **backend**: Node.js API server with hot reload
- **postgres**: PostgreSQL 15 database
- **redis**: Redis 7 for development

## Docker Commands

### Build Commands
```bash
# Build production image
npm run docker:build

# Build development image
npm run docker:build:dev

# Build all services
docker-compose build
```

### Run Commands
```bash
# Development with hot reload
npm run docker:dev

# Production
npm run docker:prod

# Run specific service
docker-compose up postgres

# Run in background
docker-compose up -d
```

### Management Commands
```bash
# Stop services
npm run docker:down

# Stop development services
npm run docker:down:dev

# View logs
npm run docker:logs

# View development logs
npm run docker:logs:dev

# Access container shell
npm run docker:shell

# Access development container shell
npm run docker:shell:dev
```

### Database Commands
```bash
# Run migrations
npm run docker:migrate

# Run seed script
npm run docker:seed

# Setup database (migrate + seed)
npm run docker:setup
```

## Environment Variables

### Required Variables
```env
DATABASE_URL=postgresql://crm_user:crm_password@postgres:5432/crm_db
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
```

### Optional Variables
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://redis:6379
```

## Service Configuration

### Backend Service
- **Port**: 3001
- **Health Check**: `/health`
- **Socket.IO**: Enabled for real-time updates
- **Hot Reload**: Development mode only

### PostgreSQL Service
- **Port**: 5432
- **Database**: crm_db
- **User**: crm_user
- **Password**: crm_password
- **Persistence**: Docker volume `postgres_data`

### Redis Service
- **Port**: 6379
- **Persistence**: Docker volume `redis_data`
- **Purpose**: Socket.IO scaling (optional)

## Development Workflow

### 1. Start Development Environment
```bash
npm run docker:dev
```

### 2. Setup Database
```bash
# In another terminal
npm run docker:setup
```

### 3. Access Services
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Socket Status**: http://localhost:3001/socket-status

### 4. View Logs
```bash
npm run docker:logs:dev
```

### 5. Access Container
```bash
npm run docker:shell:dev
```

## Production Deployment

### 1. Build Production Image
```bash
npm run docker:build
```

### 2. Run Production Stack
```bash
npm run docker:prod
```

### 3. Setup Database
```bash
npm run docker:setup
```

### 4. Monitor Services
```bash
npm run docker:logs
```

## Docker Compose Profiles

### Development Profile
```bash
# Uses docker-compose.dev.yml
docker-compose --profile dev up
```

### Redis Profile
```bash
# Includes Redis service
docker-compose --profile redis up
```

## Volume Management

### List Volumes
```bash
docker volume ls
```

### Remove Volumes
```bash
# Remove all unused volumes
docker volume prune

# Remove specific volume
docker volume rm backend_postgres_data
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U crm_user crm_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U crm_user crm_db < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3001
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

3. **Permission Denied**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Container Won't Start**
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Rebuild container
   docker-compose up --build --force-recreate
   ```

### Debug Commands

```bash
# Check container status
docker-compose ps

# Check resource usage
docker stats

# Check container logs
docker-compose logs -f backend

# Access container shell
docker-compose exec backend sh

# Check database connection
docker-compose exec backend npm run migrate
```

## Security Considerations

### Production Security
1. **Change default passwords** in `.env`
2. **Use secrets management** for sensitive data
3. **Enable SSL/TLS** for database connections
4. **Use Docker secrets** for production
5. **Regular security updates** for base images

### Environment Security
```bash
# Don't commit .env files
echo ".env" >> .gitignore

# Use Docker secrets for production
docker secret create jwt_secret ./secrets/jwt_secret.txt
```

## Scaling

### Horizontal Scaling
```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Redis for Socket.IO Scaling
```bash
# Enable Redis profile
docker-compose --profile redis up
```

## Monitoring

### Health Checks
- **Backend**: `GET /health`
- **Database**: Built-in PostgreSQL health check
- **Redis**: Built-in Redis health check

### Logging
```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
```

## Cleanup

### Stop and Remove
```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

### Complete Cleanup
```bash
# Remove everything
docker-compose down -v --rmi all
docker system prune -a
```

## Best Practices

1. **Use .env files** for configuration
2. **Don't run as root** in containers
3. **Use multi-stage builds** for smaller images
4. **Regular updates** of base images
5. **Monitor resource usage**
6. **Backup data regularly**
7. **Use Docker secrets** for production
8. **Implement health checks**
9. **Use Docker Compose profiles** for different environments
10. **Document your setup** for team members

