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
import { Lead } from './Lead';

export interface ActivityAttributes {
  id: string;
  leadId: string;
  type: 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
  body?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Activity extends Model<
  InferAttributes<Activity>,
  InferCreationAttributes<Activity>
> {
  declare id: CreationOptional<string>;
  declare leadId: string;
  declare type: 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
  declare body: CreationOptional<string>;
  declare createdBy: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare lead?: NonAttribute<Lead>;
  declare creator?: NonAttribute<User>;
}

Activity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Leads',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK'),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
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
    tableName: 'Activities',
    timestamps: true,
  }
);
