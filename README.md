# CRM System

A full-stack CRM (Customer Relationship Management) system built with Node.js, TypeScript, Next.js, and PostgreSQL.

## Features

- **Lead Management**: Create, update, and track sales leads
- **User Management**: User authentication and authorization
- **Activity Tracking**: Log and monitor customer interactions
- **Real-time Collaboration**: WebSocket-based real-time features
- **Dashboard**: Analytics and KPI tracking
- **Responsive Design**: Modern UI with Tailwind CSS

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
npm run seed
```

5. Start the development servers:
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

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

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

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
- **Users**: User accounts and authentication
- **Leads**: Sales leads and prospects
- **Activities**: Customer interactions and notes
- **RefreshTokens**: JWT refresh token management
- **CollaborativeNotes**: Real-time collaborative notes
- **UserPresence**: Online user tracking

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