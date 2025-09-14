'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Change token field from VARCHAR(255) to TEXT to accommodate longer JWT tokens
    await queryInterface.changeColumn('RefreshTokens', 'token', {
      type: Sequelize.TEXT,
      allowNull: false,
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert token field back to VARCHAR(255)
    await queryInterface.changeColumn('RefreshTokens', 'token', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true
    });
  }
};
