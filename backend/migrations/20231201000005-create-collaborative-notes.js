'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('collaborative_notes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      leadId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Leads',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      lastModified: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: {
          canEdit: [],
          canView: [],
          canDelete: []
        },
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {
          tags: [],
          category: null,
          priority: 'medium',
          dueDate: null
        },
      },
      yjsDocument: {
        type: Sequelize.BLOB,
        allowNull: true,
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
    await queryInterface.addIndex('collaborative_notes', ['leadId']);
    await queryInterface.addIndex('collaborative_notes', ['createdBy']);
    await queryInterface.addIndex('collaborative_notes', ['isActive']);
    await queryInterface.addIndex('collaborative_notes', ['lastModified']);
    await queryInterface.addIndex('collaborative_notes', ['permissions'], {
      using: 'gin',
    });
    await queryInterface.addIndex('collaborative_notes', ['metadata'], {
      using: 'gin',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('collaborative_notes');
  }
};
