# Local Development Setup

## Quick Start Options

### Option 1: Docker (Recommended)
1. Make sure Docker Desktop is running
2. Run: `docker-compose -f docker-compose.dev.yml up -d postgres`
3. Wait for the database to be ready
4. Run: `npm run dev`

### Option 2: Local PostgreSQL
1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create database and user:
   ```sql
   CREATE DATABASE crm_dev;
   CREATE USER crm_user WITH PASSWORD 'crm_password';
   GRANT ALL PRIVILEGES ON DATABASE crm_dev TO crm_user;
   ```
3. Create `.env` file in backend directory:
   ```env
   DATABASE_URL=postgresql://crm_user:crm_password@localhost:5432/crm_dev
   JWT_SECRET=dev_jwt_secret_key_for_development_only
   JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_for_development_only
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```
4. Run: `npm run dev`

### Option 3: Cloud Database
1. Sign up for a free PostgreSQL service (Neon, Supabase, Railway)
2. Get your connection string
3. Create `.env` file with your connection string:
   ```env
   DATABASE_URL=your_cloud_connection_string_here
   JWT_SECRET=dev_jwt_secret_key_for_development_only
   JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_for_development_only
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```
4. Run: `npm run dev`

## Database Migration
After setting up the database, run:
```bash
npm run migrate:sync
```

This will create all the necessary tables in your database.
