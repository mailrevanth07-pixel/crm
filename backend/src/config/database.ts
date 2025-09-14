import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

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
  dialect: 'postgres' as const,
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
  dialect: 'postgres' as const,
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

const sequelize = new Sequelize(dbConfig);

// Export configuration for Sequelize CLI
export const config = {
  development: databaseUrl ? {
    url: databaseUrl,
    dialect: 'postgres',
    dialectOptions: {
      ssl: databaseUrl.includes('render.com') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false
  } : {
    host: dbHost,
    port: parseInt(dbPort),
    database: dbName,
    username: dbUser,
    password: dbPassword,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    logging: false
  },
  production: databaseUrl ? {
    url: databaseUrl,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  } : {
    host: dbHost,
    port: parseInt(dbPort),
    database: dbName,
    username: dbUser,
    password: dbPassword,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    logging: false
  }
};

export default sequelize;
