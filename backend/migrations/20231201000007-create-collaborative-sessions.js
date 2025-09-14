'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('collaborative_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      noteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'collaborative_notes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sessionId: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      participants: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      startedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      endedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastActivity: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      yjsUpdates: {
        type: Sequelize.ARRAY(Sequelize.BLOB),
        defaultValue: [],
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {
          totalEdits: 0,
          totalParticipants: 0,
          averageSessionDuration: null,
          conflictResolutions: 0
        },
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
    await queryInterface.addIndex('collaborative_sessions', ['noteId']);
    await queryInterface.addIndex('collaborative_sessions', ['sessionId']);
    await queryInterface.addIndex('collaborative_sessions', ['isActive']);
    await queryInterface.addIndex('collaborative_sessions', ['lastActivity']);
    await queryInterface.addIndex('collaborative_sessions', ['participants'], {
      using: 'gin',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('collaborative_sessions');
  }
};
