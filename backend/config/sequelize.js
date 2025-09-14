const dotenv = require('dotenv');
dotenv.config();

// Get database configuration from environment variables
const databaseUrl = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'crm_db';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'password';

// Create database configuration
const dbConfig = databaseUrl ? {
  url: databaseUrl,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: databaseUrl.includes('render.com') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
} : {
  host: dbHost,
  port: parseInt(dbPort),
  database: dbName,
  username: dbUser,
  password: dbPassword,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: false
  },
};

module.exports = {
  development: dbConfig,
  production: dbConfig,
  test: {
    ...dbConfig,
    database: dbName + '_test'
  }
};
