import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL || '', {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: process.env.DATABASE_URL?.includes('render.com') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
});

// Export configuration for Sequelize CLI
export const config = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DATABASE_URL?.includes('render.com') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};

export default sequelize;
