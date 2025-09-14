# Render Environment Variables Setup

## Quick Setup Guide

### 1. Create PostgreSQL Database in Render
1. Go to your Render dashboard
2. Click "New +" → "PostgreSQL"
3. Choose a name (e.g., "crm-database")
4. Select the free tier
5. Click "Create Database"
6. Wait for it to be ready

### 2. Get Database URL
1. Click on your database service
2. Go to "Info" tab
3. Copy the "External Database URL"
4. It should look like: `postgresql://username:password@hostname:port/database`

### 3. Set Environment Variables in Your Web Service
1. Go to your web service in Render
2. Click "Environment" tab
3. Add these variables:

```
DATABASE_URL=postgresql://username:password@hostname:port/database
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
FRONTEND_URL=https://your-frontend.vercel.app
```

### 4. Generate Strong Secrets
Use this command to generate strong secrets:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Deploy
1. Save the environment variables
2. Go to "Manual Deploy" → "Deploy latest commit"
3. Check the logs for any errors

## Troubleshooting

### Database Connection Issues
- Make sure DATABASE_URL is set correctly
- Check that the database is running (not paused)
- Verify the URL format includes `postgresql://`

### Common Errors
- `ECONNREFUSED` - Database URL not set or incorrect
- `Authentication failed` - Wrong credentials in DATABASE_URL
- `SSL required` - Database requires SSL (should be handled automatically)

### Debug Steps
1. Check the deployment logs
2. Verify environment variables are set
3. Test database connection manually
4. Check if database is paused (free tier pauses after inactivity)
