'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_presence', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      resourceType: {
        type: Sequelize.ENUM('note', 'lead', 'activity'),
        allowNull: false,
      },
      resourceId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      lastSeen: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      cursorPosition: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      selection: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('viewing', 'editing', 'idle'),
        defaultValue: 'viewing',
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('user_presence', ['userId']);
    await queryInterface.addIndex('user_presence', ['resourceType', 'resourceId']);
    await queryInterface.addIndex('user_presence', ['isActive']);
    await queryInterface.addIndex('user_presence', ['lastSeen']);
    await queryInterface.addIndex('user_presence', ['status']);
    
    // Add unique constraint for userId, resourceType, resourceId combination
    await queryInterface.addIndex('user_presence', ['userId', 'resourceType', 'resourceId'], {
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_presence');
  }
};
