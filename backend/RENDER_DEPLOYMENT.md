# Render Deployment Guide

## Environment Variables Setup

When deploying to Render, you need to set the following environment variables in your Render dashboard:

### Required Environment Variables

1. **DATABASE_URL** (Primary - if using Render PostgreSQL)
   - This should be automatically provided by Render if you're using their PostgreSQL service
   - Format: `postgresql://username:password@hostname:port/database`
   - **IMPORTANT**: Make sure to copy the full DATABASE_URL from your Render PostgreSQL service dashboard

2. **Alternative Database Configuration** (if not using DATABASE_URL)
   - `DB_HOST` - Your PostgreSQL host
   - `DB_PORT` - PostgreSQL port (usually 5432)
   - `DB_NAME` - Database name
   - `DB_USER` - Database username
   - `DB_PASSWORD` - Database password

### Required Environment Variables for Production

- `NODE_ENV` - Set to `production`
- `JWT_SECRET` - Secret key for JWT tokens (generate a strong secret)
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens (generate a different strong secret)
- `FRONTEND_URL` - Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

### Optional Environment Variables

- `PORT` - Port number (Render will set this automatically)
- `REDIS_URL` - Redis connection URL (if using Redis for caching)
- `CORS_ORIGIN` - Additional CORS origin (if different from FRONTEND_URL)

### CORS Configuration

The backend is configured to accept requests from:
- `FRONTEND_URL` environment variable
- `CORS_ORIGIN` environment variable
- `http://localhost:3000` (development)
- `https://localhost:3000` (development with HTTPS)
- `http://127.0.0.1:3000` (alternative localhost)
- `https://127.0.0.1:3000` (alternative localhost with HTTPS)

**Important**: Make sure your `FRONTEND_URL` is set to your actual Vercel deployment URL.

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
4. **IMPORTANT**: Make sure to copy the complete URL including the protocol (`postgresql://`)

### Option 2: Using External Database
1. Set individual database environment variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`

## Environment Variables Checklist

Before deploying, ensure you have set:

- [ ] `DATABASE_URL` (from Render PostgreSQL service)
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (generate a strong secret)
- [ ] `JWT_REFRESH_SECRET` (generate a different strong secret)
- [ ] `FRONTEND_URL` (your Vercel frontend URL)
- [ ] `REDIS_URL` (if using Redis)

## Troubleshooting

### Common Issues

1. **Database Connection Refused**
   - Check if `DATABASE_URL` is set correctly
   - Verify database credentials
   - Ensure database is accessible from Render

2. **CORS Errors**
   - Verify `FRONTEND_URL` is set to your actual Vercel URL
   - Check browser console for the exact origin being blocked
   - Ensure your frontend is making requests to the correct backend URL
   - Check if `CORS_ORIGIN` is set if using a different domain

3. **SSL Connection Issues**
   - The app automatically handles SSL for production environments
   - Make sure your database supports SSL connections

4. **Environment Variables Not Loading**
   - Check variable names (case-sensitive)
   - Ensure no extra spaces in values
   - Redeploy after setting variables

5. **Socket.IO Connection Issues**
   - Verify `FRONTEND_URL` is set correctly
   - Check if WebSocket connections are being blocked by firewall
   - Ensure both HTTP and WebSocket protocols are allowed

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
