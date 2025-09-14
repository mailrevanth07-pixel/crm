import dotenv from 'dotenv';
import { sequelize, User } from '../src/models';

dotenv.config();

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully.');

    console.log('🔄 Creating admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists.');
    } else {
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin123',
        role: 'ADMIN'
      });
      console.log('✅ Admin user created successfully:', {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      });
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupDatabase();
