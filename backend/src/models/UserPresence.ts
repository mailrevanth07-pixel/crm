import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

export interface UserPresenceAttributes {
  id: string;
  userId: string;
  resourceType: 'note' | 'lead' | 'activity';
  resourceId: string;
  isActive: boolean;
  lastSeen: Date;
  cursorPosition?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  status: 'viewing' | 'editing' | 'idle';
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPresenceCreationAttributes extends Optional<UserPresenceAttributes, 'id' | 'isActive' | 'lastSeen' | 'cursorPosition' | 'selection' | 'status' | 'metadata' | 'createdAt' | 'updatedAt'> {}

export class UserPresence extends Model<UserPresenceAttributes, UserPresenceCreationAttributes> implements UserPresenceAttributes {
  public id!: string;
  public userId!: string;
  public resourceType!: 'note' | 'lead' | 'activity';
  public resourceId!: string;
  public isActive!: boolean;
  public lastSeen!: Date;
  public cursorPosition?: {
    line: number;
    column: number;
  };
  public selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  public status!: 'viewing' | 'editing' | 'idle';
  public metadata!: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public updatePresence(status: 'viewing' | 'editing' | 'idle', cursorPosition?: { line: number; column: number }, selection?: { start: { line: number; column: number }; end: { line: number; column: number } }): void {
    this.status = status;
    this.lastSeen = new Date();
    this.isActive = true;
    
    if (cursorPosition) {
      this.cursorPosition = cursorPosition;
    }
    
    if (selection) {
      this.selection = selection;
    }
  }

  public markInactive(): void {
    this.isActive = false;
    this.status = 'idle';
    this.lastSeen = new Date();
  }

  public isRecentlyActive(thresholdMinutes: number = 5): boolean {
    const now = new Date();
    const diffMinutes = (now.getTime() - this.lastSeen.getTime()) / (1000 * 60);
    return diffMinutes <= thresholdMinutes;
  }

  public toJSON(): any {
    const values = Object.assign({}, this.get());
    return values;
  }
}

UserPresence.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    resourceType: {
      type: DataTypes.ENUM('note', 'lead', 'activity'),
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    cursorPosition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    selection: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('viewing', 'editing', 'idle'),
      defaultValue: 'viewing',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'UserPresence',
    tableName: 'user_presence',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['resourceType', 'resourceId'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['lastSeen'],
      },
      {
        fields: ['status'],
      },
      {
        unique: true,
        fields: ['userId', 'resourceType', 'resourceId'],
      },
    ],
  }
);

export default UserPresence;
