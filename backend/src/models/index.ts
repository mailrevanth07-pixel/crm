import sequelize from '../config/database';
import { User } from './User';
import { Lead } from './Lead';
import { Activity } from './Activity';
import { RefreshToken } from './RefreshToken';
import { CollaborativeNote } from './CollaborativeNote';
import { UserPresence } from './UserPresence';
import { CollaborativeSession } from './CollaborativeSession';

// Define associations
// User associations
User.hasMany(Lead, { foreignKey: 'ownerId' });
Lead.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

User.hasMany(Activity, { foreignKey: 'createdBy' });
Activity.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// Lead associations
Lead.hasMany(Activity, { foreignKey: 'leadId' });
Activity.belongsTo(Lead, { as: 'lead', foreignKey: 'leadId' });

// Collaborative Note associations
User.hasMany(CollaborativeNote, { foreignKey: 'createdBy' });
CollaborativeNote.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

User.hasMany(CollaborativeNote, { foreignKey: 'updatedBy' });
CollaborativeNote.belongsTo(User, { as: 'updater', foreignKey: 'updatedBy' });

Lead.hasMany(CollaborativeNote, { foreignKey: 'leadId' });
CollaborativeNote.belongsTo(Lead, { foreignKey: 'leadId' });

// User Presence associations
User.hasMany(UserPresence, { foreignKey: 'userId' });
UserPresence.belongsTo(User, { foreignKey: 'userId' });

// Collaborative Session associations
CollaborativeNote.hasMany(CollaborativeSession, { foreignKey: 'noteId' });
CollaborativeSession.belongsTo(CollaborativeNote, { foreignKey: 'noteId' });

// Export models and sequelize instance
export { 
  sequelize, 
  User, 
  Lead, 
  Activity, 
  RefreshToken, 
  CollaborativeNote, 
  UserPresence, 
  CollaborativeSession 
};
