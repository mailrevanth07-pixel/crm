import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

export interface CollaborativeSessionAttributes {
  id: string;
  noteId: string;
  sessionId: string;
  participants: string[]; // Array of user IDs
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  lastActivity: Date;
  yjsUpdates: Buffer[]; // Array of Y.js update buffers
  metadata: {
    totalEdits: number;
    totalParticipants: number;
    averageSessionDuration?: number;
    conflictResolutions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborativeSessionCreationAttributes extends Optional<CollaborativeSessionAttributes, 'id' | 'isActive' | 'startedAt' | 'endedAt' | 'lastActivity' | 'yjsUpdates' | 'metadata' | 'createdAt' | 'updatedAt'> {}

export class CollaborativeSession extends Model<CollaborativeSessionAttributes, CollaborativeSessionCreationAttributes> implements CollaborativeSessionAttributes {
  public id!: string;
  public noteId!: string;
  public sessionId!: string;
  public participants!: string[];
  public isActive!: boolean;
  public startedAt!: Date;
  public endedAt?: Date;
  public lastActivity!: Date;
  public yjsUpdates!: Buffer[];
  public metadata!: {
    totalEdits: number;
    totalParticipants: number;
    averageSessionDuration?: number;
    conflictResolutions: number;
  };
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public addParticipant(userId: string): void {
    if (!this.participants.includes(userId)) {
      this.participants.push(userId);
      this.metadata.totalParticipants = this.participants.length;
      this.updateActivity();
    }
  }

  public removeParticipant(userId: string): void {
    this.participants = this.participants.filter(id => id !== userId);
    this.metadata.totalParticipants = this.participants.length;
    this.updateActivity();
  }

  public addYjsUpdate(update: Buffer): void {
    this.yjsUpdates.push(update);
    this.metadata.totalEdits += 1;
    this.updateActivity();
  }

  public updateActivity(): void {
    this.lastActivity = new Date();
  }

  public endSession(): void {
    this.isActive = false;
    this.endedAt = new Date();
    
    // Calculate session duration
    const duration = this.endedAt.getTime() - this.startedAt.getTime();
    this.metadata.averageSessionDuration = duration;
  }

  public getSessionDuration(): number {
    const endTime = this.endedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  public getActiveParticipants(): string[] {
    return this.participants;
  }

  public getRecentUpdates(count: number = 10): Buffer[] {
    return this.yjsUpdates.slice(-count);
  }

  public toJSON(): any {
    const values = Object.assign({}, this.get()) as any;
    // Convert Buffer array to base64 array for JSON serialization
    if (values.yjsUpdates && Array.isArray(values.yjsUpdates)) {
      values.yjsUpdates = values.yjsUpdates.map((buffer: any) => 
        Buffer.isBuffer(buffer) ? buffer.toString('base64') : buffer
      );
    }
    return values;
  }
}

CollaborativeSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    noteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'CollaborativeNotes',
        key: 'id',
      },
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    participants: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    yjsUpdates: {
      type: DataTypes.ARRAY(DataTypes.BLOB),
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalEdits: 0,
        totalParticipants: 0,
        averageSessionDuration: null,
        conflictResolutions: 0
      },
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
    modelName: 'CollaborativeSession',
    tableName: 'collaborative_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['noteId'],
      },
      {
        fields: ['sessionId'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['lastActivity'],
      },
      {
        fields: ['participants'],
        using: 'gin',
      },
    ],
  }
);

export default CollaborativeSession;
