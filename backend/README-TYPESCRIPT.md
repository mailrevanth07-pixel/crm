# CRM Backend - TypeScript Setup

This is the TypeScript version of the CRM backend with Express, Sequelize, and PostgreSQL.

## Features

- ✅ TypeScript configuration with strict type checking
- ✅ Sequelize models with proper TypeScript types
- ✅ PostgreSQL database integration
- ✅ ESLint and Prettier for code quality
- ✅ Nodemon for development with hot reload
- ✅ Environment-based configuration
- ✅ Database seeding with admin user

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Sequelize configuration
│   ├── models/
│   │   ├── index.ts             # Model associations and exports
│   │   ├── User.ts              # User model with TypeScript types
│   │   ├── Lead.ts              # Lead model with TypeScript types
│   │   ├── Activity.ts          # Activity model with TypeScript types
│   │   └── RefreshToken.ts      # RefreshToken model with TypeScript types
│   └── server.ts                # Express server entry point
├── scripts/
│   └── setup.ts                 # Database setup and admin user creation
├── tsconfig.json                # TypeScript configuration
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── nodemon.json                 # Nodemon configuration
└── package.json                 # Dependencies and scripts
```

## Database Models

### User
- `id`: UUID (Primary Key)
- `name`: String (Optional)
- `email`: String (Unique, Required)
- `password`: String (Required, Hashed)
- `role`: Enum ('ADMIN', 'MANAGER', 'SALES')

### Lead
- `id`: UUID (Primary Key)
- `title`: String (Required)
- `description`: Text (Optional)
- `status`: Enum ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED')
- `source`: String (Optional)
- `ownerId`: UUID (Foreign Key to User)
- `metadata`: JSONB (Optional)

### Activity
- `id`: UUID (Primary Key)
- `leadId`: UUID (Foreign Key to Lead)
- `type`: Enum ('NOTE', 'CALL', 'EMAIL')
- `body`: Text (Optional)
- `createdBy`: UUID (Foreign Key to User)

### RefreshToken
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key to User)
- `token`: String (Unique, Required)
- `expiresAt`: Date (Required)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   Update the `.env` file with your database credentials:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/crm_db
   JWT_SECRET=your_jwt_secret_key_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
   PORT=3001
   NODE_ENV=development
   ```

3. **Database Setup**
   ```bash
   # Run migrations (if using Sequelize CLI)
   npm run migrate
   
   # Or setup database and create admin user
   npm run setup
   ```

4. **Development**
   ```bash
   # Start development server with hot reload
   npm run dev
   
   # Build TypeScript
   npm run build
   
   # Start production server
   npm start
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run setup` - Setup database and create admin user
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier

## API Endpoints

- `GET /health` - Health check
- `GET /test-db` - Test database connection

## Admin User

The setup script creates an admin user with the following credentials:
- **Email**: admin@local
- **Password**: Admin123
- **Role**: ADMIN

## TypeScript Features

- **Strict Type Checking**: All models have proper TypeScript interfaces
- **Type Safety**: Sequelize models with full type inference
- **IntelliSense**: Full IDE support with autocomplete
- **Error Prevention**: Compile-time error checking

## Development Tools

- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **Nodemon**: Hot reload for development
- **ts-node**: TypeScript execution without compilation
