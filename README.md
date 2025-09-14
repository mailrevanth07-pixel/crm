# CRM Application

A full-stack CRM application built with Next.js, Node.js, TypeScript, and PostgreSQL.

## Features

- **Frontend**: Next.js with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript, Sequelize ORM
- **Database**: PostgreSQL with Redis for caching
- **Real-time**: Socket.io for collaborative features
- **Authentication**: JWT-based authentication with refresh tokens
- **Testing**: Jest with comprehensive test coverage
- **CI/CD**: GitHub Actions with automated testing and deployment

## Project Structure

```
CRM/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js backend API
├── .github/           # GitHub Actions workflows
└── docker-compose.*   # Docker configuration files
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd CRM
```

2. Install dependencies for both frontend and backend:
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
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your API URL
```

4. Set up the database:
```bash
cd backend
npm run migrate
npm run seed:run
```

5. Start the development servers:
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

## Docker Setup

### Development
```bash
# Start all services
docker-compose -f docker-compose.full.yml up --build

# Or start individual services
docker-compose up --build
```

### Production
```bash
docker-compose -f docker-compose.prod.full.yml up --build
```

## Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

## Linting and Formatting

### Backend
```bash
cd backend
npm run lint
npm run lint:fix
npm run format
```

### Frontend
```bash
cd frontend
npm run lint
```

## CI/CD Pipeline

The project includes GitHub Actions workflows for:

- **Linting**: ESLint and Prettier checks
- **Testing**: Jest test suites for both frontend and backend
- **Security**: Trivy vulnerability scanning
- **Build**: Docker image building and pushing
- **Deployment**: Automated deployment on main branch

### Workflow Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Leads Endpoints
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Activities Endpoints
- `GET /api/activities` - Get all activities
- `POST /api/activities` - Create new activity

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or create an issue in the repository.
