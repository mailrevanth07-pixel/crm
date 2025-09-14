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

// Parse database URL if available
interface DatabaseConfig {
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  dialect: 'postgres';
  logging: boolean;
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  dialectOptions: {
    ssl: boolean | { require: boolean; rejectUnauthorized: boolean };
    connectTimeout: number;
    acquireTimeout: number;
    timeout: number;
  };
}

let parsedConfig: Partial<DatabaseConfig> = {};
if (databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    parsedConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1), // Remove leading slash
      username: url.username,
      password: url.password,
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
        } : false,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
      }
    };
  } catch (error) {
    console.error('Error parsing database URL:', error);
    // Fallback to URL method
    parsedConfig = {
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
        } : false,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
      }
    };
  }
}

// Create database configuration
const dbConfig: DatabaseConfig = databaseUrl ? parsedConfig as DatabaseConfig : {
  host: dbHost,
  port: parseInt(dbPort),
  database: dbName,
  username: dbUser,
  password: dbPassword,
  dialect: 'postgres' as const,
  logging: process.env.NODE_ENV === 'development',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000
  },
};

// Debug: Log the configuration being used
console.log('Database configuration:', {
  hasUrl: !!databaseUrl,
  urlLength: databaseUrl?.length || 0,
  isRender: databaseUrl?.includes('render.com') || false,
  parsedConfig: databaseUrl ? {
    host: parsedConfig.host || 'undefined',
    port: parsedConfig.port || 'undefined',
    database: parsedConfig.database || 'undefined',
    username: parsedConfig.username || 'undefined',
    hasPassword: !!parsedConfig.password
  } : 'Using fallback config'
});

// Log the actual database URL for debugging (without password)
if (databaseUrl) {
  const url = new URL(databaseUrl);
  console.log('Database URL:', `${url.protocol}//${url.username}:***@${url.hostname}:${url.port}${url.pathname}`);
} else {
  console.log('Database URL: Not set');
}

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
