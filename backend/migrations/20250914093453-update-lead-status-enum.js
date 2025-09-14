'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update the lead status enum to include all possible values
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Leads_status" ADD VALUE IF NOT EXISTS 'PROPOSAL';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Leads_status" ADD VALUE IF NOT EXISTS 'NEGOTIATION';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Leads_status" ADD VALUE IF NOT EXISTS 'CLOSED_WON';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Leads_status" ADD VALUE IF NOT EXISTS 'CLOSED_LOST';
    `);
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This migration is not easily reversible
    console.log('Warning: This migration cannot be easily reversed due to PostgreSQL enum limitations');
  }
};
