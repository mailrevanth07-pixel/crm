const sequelize = require('../config/db');
const User = require('./User');
const Lead = require('./Lead');
const Activity = require('./Activity');
const RefreshToken = require('./RefreshToken');

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
Activity.belongsTo(Lead, { foreignKey: 'leadId' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Lead,
  Activity,
  RefreshToken
};
