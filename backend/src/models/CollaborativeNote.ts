import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

export interface CollaborativeNoteAttributes {
  id: string;
  title: string;
  content: string;
  leadId?: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  version: number;
  lastModified: Date;
  permissions: {
    canEdit: string[];
    canView: string[];
    canDelete: string[];
  };
  metadata: {
    tags: string[];
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
  };
  yjsDocument: Buffer; // Y.js document state
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborativeNoteCreationAttributes extends Optional<CollaborativeNoteAttributes, 'id' | 'version' | 'isActive' | 'lastModified' | 'permissions' | 'metadata' | 'yjsDocument' | 'createdAt' | 'updatedAt'> {}

export class CollaborativeNote extends Model<CollaborativeNoteAttributes, CollaborativeNoteCreationAttributes> implements CollaborativeNoteAttributes {
  public id!: string;
  public title!: string;
  public content!: string;
  public leadId?: string;
  public createdBy!: string;
  public updatedBy?: string;
  public isActive!: boolean;
  public version!: number;
  public lastModified!: Date;
  public permissions!: {
    canEdit: string[];
    canView: string[];
    canDelete: string[];
  };
  public metadata!: {
    tags: string[];
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
  };
  public yjsDocument!: Buffer;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public hasEditPermission(userId: string): boolean {
    return this.permissions.canEdit.includes(userId) || this.createdBy === userId;
  }

  public hasViewPermission(userId: string): boolean {
    return this.permissions.canView.includes(userId) || this.permissions.canEdit.includes(userId) || this.createdBy === userId;
  }

  public hasDeletePermission(userId: string): boolean {
    return this.permissions.canDelete.includes(userId) || this.createdBy === userId;
  }

  public addEditPermission(userId: string): void {
    if (!this.permissions.canEdit.includes(userId)) {
      this.permissions.canEdit.push(userId);
    }
  }

  public addViewPermission(userId: string): void {
    if (!this.permissions.canView.includes(userId)) {
      this.permissions.canView.push(userId);
    }
  }

  public removePermission(userId: string): void {
    this.permissions.canEdit = this.permissions.canEdit.filter(id => id !== userId);
    this.permissions.canView = this.permissions.canView.filter(id => id !== userId);
    this.permissions.canDelete = this.permissions.canDelete.filter(id => id !== userId);
  }

  public incrementVersion(): void {
    this.version += 1;
    this.lastModified = new Date();
  }

  public toJSON(): any {
    const values = Object.assign({}, this.get()) as any;
    // Convert Buffer to base64 for JSON serialization
    if (values.yjsDocument && Buffer.isBuffer(values.yjsDocument)) {
      values.yjsDocument = values.yjsDocument.toString('base64');
    }
    return values;
  }
}

CollaborativeNote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Leads',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    lastModified: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {
        canEdit: [],
        canView: [],
        canDelete: []
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        tags: [],
        category: null,
        priority: 'medium',
        dueDate: null
      },
    },
    yjsDocument: {
      type: DataTypes.BLOB,
      allowNull: true,
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
    modelName: 'CollaborativeNote',
    tableName: 'collaborative_notes',
    timestamps: true,
    indexes: [
      {
        fields: ['leadId'],
      },
      {
        fields: ['createdBy'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['lastModified'],
      },
      {
        fields: ['permissions'],
        using: 'gin',
      },
      {
        fields: ['metadata'],
        using: 'gin',
      },
    ],
  }
);

export default CollaborativeNote;
