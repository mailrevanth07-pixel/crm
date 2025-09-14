import {
  DataTypes,
  Model,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';
import { Lead } from './Lead';
import { Activity } from './Activity';
import { RefreshToken } from './RefreshToken';

export interface UserAttributes {
  id: string;
  name?: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES';
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare name: CreationOptional<string>;
  declare email: string;
  declare password: string;
  declare role: CreationOptional<'ADMIN' | 'MANAGER' | 'SALES'>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare leads?: NonAttribute<Lead[]>;
  declare activities?: NonAttribute<Activity[]>;
  declare refreshTokens?: NonAttribute<RefreshToken[]>;

  // Instance methods
  async checkPassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'MANAGER', 'SALES'),
      defaultValue: 'SALES',
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);
