# CRM System

A full-stack CRM (Customer Relationship Management) system built with Node.js, TypeScript, Next.js, and PostgreSQL.

## Features

- **Lead Management**: Create, update, and track sales leads
- **User Management**: Complete user authentication and authorization system
- **Activity Tracking**: Log and monitor customer interactions
- **Real-time Collaboration**: WebSocket-based real-time features
- **Dashboard**: Analytics and KPI tracking
- **Responsive Design**: Modern UI with Tailwind CSS
- **Role-based Access Control**: ADMIN, MANAGER, and SALES roles
- **JWT Authentication**: Secure token-based authentication with refresh tokens

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js framework
- PostgreSQL database
- Sequelize ORM
- Socket.io for real-time communication
- JWT authentication
- Redis for caching

### Frontend
- Next.js with TypeScript
- React components
- Tailwind CSS for styling
- Socket.io client for real-time features
- Context API for state management

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

## Docker Deployment

### Using Docker Compose

1. Build and start all services:
```bash
docker-compose up --build
```

2. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Individual Services

#### Backend
```bash
cd backend
docker build -t crm-backend .
docker run -p 3001:3001 --env-file .env crm-backend
```

#### Frontend
```bash
cd frontend
docker build -t crm-frontend .
docker run -p 3000:3000 crm-frontend
```

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

## API Endpoints

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

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
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

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

## License

MIT License