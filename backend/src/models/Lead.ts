import {
  DataTypes,
  Model,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import sequelize from '../config/database';
import { User } from './User';
import { Activity } from './Activity';

export interface LeadAttributes {
  id: string;
  title: string;
  description?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  source?: string;
  ownerId?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Lead extends Model<
  InferAttributes<Lead>,
  InferCreationAttributes<Lead>
> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare description: CreationOptional<string>;
  declare status: CreationOptional<'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST'>;
  declare source: CreationOptional<string>;
  declare ownerId: CreationOptional<string>;
  declare metadata: CreationOptional<Record<string, any>>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare owner?: NonAttribute<User>;
  declare activities?: NonAttribute<Activity[]>;
}

Lead.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED'),
      defaultValue: 'NEW',
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    tableName: 'Leads',
    timestamps: true,
  }
);
