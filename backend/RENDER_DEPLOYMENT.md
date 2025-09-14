# Render Deployment Guide

## Environment Variables Setup

When deploying to Render, you need to set the following environment variables in your Render dashboard:

### Required Environment Variables

1. **DATABASE_URL** (Primary - if using Render PostgreSQL)
   - This should be automatically provided by Render if you're using their PostgreSQL service
   - Format: `postgresql://username:password@hostname:port/database`

2. **Alternative Database Configuration** (if not using DATABASE_URL)
   - `DB_HOST` - Your PostgreSQL host
   - `DB_PORT` - PostgreSQL port (usually 5432)
   - `DB_NAME` - Database name
   - `DB_USER` - Database username
   - `DB_PASSWORD` - Database password

### Optional Environment Variables

- `NODE_ENV` - Set to `production` for production deployments
- `PORT` - Port number (Render will set this automatically)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `REDIS_URL` - Redis connection URL (if using Redis)
- `CORS_ORIGIN` - Frontend URL for CORS

## Steps to Deploy

1. **Connect your GitHub repository** to Render
2. **Create a PostgreSQL database** in Render (if not using external database)
3. **Set environment variables** in Render dashboard
4. **Deploy the service**

## Database Setup

### Option 1: Using Render PostgreSQL (Recommended)
1. Create a new PostgreSQL database in Render
2. Copy the `DATABASE_URL` from the database dashboard
3. Set `DATABASE_URL` in your service environment variables

### Option 2: Using External Database
1. Set individual database environment variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`

## Troubleshooting

### Common Issues

1. **Database Connection Refused**
   - Check if `DATABASE_URL` is set correctly
   - Verify database credentials
   - Ensure database is accessible from Render

2. **SSL Connection Issues**
   - The app automatically handles SSL for production environments
   - Make sure your database supports SSL connections

3. **Environment Variables Not Loading**
   - Check variable names (case-sensitive)
   - Ensure no extra spaces in values
   - Redeploy after setting variables

### Debug Endpoints

- `/health` - Basic health check
- `/test-db` - Test database connection
- `/socket-status` - Check Socket.IO status

## Build Configuration

The app uses the following build commands:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18

## Health Checks

Render will use the `/health` endpoint for health checks. The app includes:
- Database connection verification
- Basic service status
- Proper error handling
