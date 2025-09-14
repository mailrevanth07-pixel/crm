const { sequelize, User } = require('../models');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('✓ Database synchronized');

    // Create default admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'ADMIN'
    });

    console.log('✓ Default admin user created:');
    console.log('  Email: admin@crm.com');
    console.log('  Password: admin123');
    console.log('  Role: ADMIN');

    // Create sample manager user
    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@crm.com',
      password: 'manager123',
      role: 'MANAGER'
    });

    console.log('✓ Sample manager user created:');
    console.log('  Email: manager@crm.com');
    console.log('  Password: manager123');
    console.log('  Role: MANAGER');

    // Create sample sales user
    const salesUser = await User.create({
      name: 'Sales User',
      email: 'sales@crm.com',
      password: 'sales123',
      role: 'SALES'
    });

    console.log('✓ Sample sales user created:');
    console.log('  Email: sales@crm.com');
    console.log('  Password: sales123');
    console.log('  Role: SALES');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

setupDatabase();
