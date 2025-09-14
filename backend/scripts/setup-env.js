const fs = require('fs');
const path = require('path');

const envContent = `# Database Configuration
# For local PostgreSQL (make sure PostgreSQL is running on localhost:5432)
DATABASE_URL=postgresql://crm_user:crm_password@localhost:5432/crm_dev

# Alternative: Use individual connection parameters
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=crm_password
POSTGRES_DB=crm_dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=dev_jwt_secret_key_for_development_only
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_for_development_only

# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Redis Configuration (Optional - for Socket.IO scaling)
REDIS_URL=redis://localhost:6379

# For cloud databases, use the connection string provided by your service
# Example for Neon: DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
`;

const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with default configuration');
  console.log('📝 Please update the DATABASE_URL if you\'re using a different database setup');
} else {
  console.log('⚠️  .env file already exists, skipping creation');
}

console.log('\n🚀 Next steps:');
console.log('1. Make sure PostgreSQL is running locally or use Docker');
console.log('2. Run: npm run migrate:sync');
console.log('3. Run: npm run dev');
