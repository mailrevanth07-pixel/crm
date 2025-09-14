# CRM Backend

A Node.js backend for a Customer Relationship Management (CRM) system built with Express, Sequelize, and PostgreSQL.

## Features

- **User Management**: Users with roles (ADMIN, MANAGER, SALES)
- **Lead Management**: Track leads with status, source, and metadata
- **Activity Tracking**: Notes, calls, and emails for each lead
- **Authentication**: JWT-based authentication with refresh tokens
- **Role-based Access Control**: Different permissions for different user roles

## Models

### User
- `id`: UUID (Primary Key)
- `name`: String (nullable)
- `email`: String (unique, not null)
- `password`: String (hashed, not null)
- `role`: ENUM('ADMIN','MANAGER','SALES') default 'SALES'
- `createdAt`, `updatedAt`: Timestamps

### Lead
- `id`: UUID (Primary Key)
- `title`: String (not null)
- `description`: Text (nullable)
- `status`: ENUM('NEW','CONTACTED','QUALIFIED','CLOSED') default 'NEW'
- `source`: String (nullable)
- `ownerId`: UUID (Foreign Key to User.id, nullable)
- `metadata`: JSONB (nullable)
- `createdAt`, `updatedAt`: Timestamps

### Activity
- `id`: UUID (Primary Key)
- `leadId`: UUID (Foreign Key to Lead.id, not null)
- `type`: ENUM('NOTE','CALL','EMAIL') (not null)
- `body`: Text
- `createdBy`: UUID (Foreign Key to User.id, nullable)
- `createdAt`, `updatedAt`: Timestamps

### RefreshToken
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key to User.id)
- `token`: String (unique)
- `expiresAt`: DateTime
- `createdAt`, `updatedAt`: Timestamps

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `env.example` to `.env`
   - Update database credentials and JWT secrets

3. **Database Setup**
   - Ensure PostgreSQL is running
   - Create a database for the CRM
   - Update the `.env` file with your database credentials

4. **Run Migrations** (Production)
   ```bash
   npm run migrate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (ADMIN only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (ADMIN only)

### Leads
- `GET /api/leads` - Get all leads (with pagination)
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Activities
- `GET /api/activities/lead/:leadId` - Get activities for a lead
- `GET /api/activities/:id` - Get activity by ID
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

## Role-based Access Control

- **ADMIN**: Full access to all resources
- **MANAGER**: Can view and manage all leads and activities
- **SALES**: Can only view and manage their own leads and activities

## Database Notes

- Uses PostgreSQL with JSONB for metadata storage
- UUID primary keys for all models
- Proper foreign key constraints and cascading deletes
- Bcrypt for password hashing
- JWT for authentication with refresh token support

## Development

- Uses `sync({ alter: true })` in development mode
- Migrations available for production deployment
- Comprehensive error handling and logging
- CORS enabled for frontend integration
