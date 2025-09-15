/**
 * MQTT Setup Script
 * Helps configure MQTT for the CRM system
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 MQTT Setup for CRM System');
console.log('============================');
console.log('');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env file not found');
  console.log('📝 Please create a .env file with the following content:');
  console.log('');
  console.log('# MQTT Configuration');
  console.log('MQTT_BROKER_URL=ws://broker.hivemq.com:8000/mqtt');
  console.log('MQTT_USERNAME=');
  console.log('MQTT_PASSWORD=');
  console.log('');
  console.log('# Other required variables...');
  console.log('NODE_ENV=development');
  console.log('PORT=3001');
  console.log('DB_HOST=localhost');
  console.log('DB_PORT=5432');
  console.log('DB_NAME=crm_db');
  console.log('DB_USER=postgres');
  console.log('DB_PASSWORD=password');
  console.log('JWT_SECRET=your-super-secret-jwt-key-here');
  console.log('JWT_REFRESH_SECRET=your-super-secret-refresh-key-here');
  console.log('FRONTEND_URL=http://localhost:3000');
  console.log('CORS_ORIGIN=http://localhost:3000');
  console.log('REDIS_URL=redis://localhost:6379');
  process.exit(1);
}

// Read .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if MQTT configuration exists
if (envContent.includes('MQTT_BROKER_URL')) {
  console.log('✅ MQTT configuration found in .env file');
  
  // Extract MQTT broker URL
  const mqttUrlMatch = envContent.match(/MQTT_BROKER_URL=(.+)/);
  if (mqttUrlMatch) {
    const mqttUrl = mqttUrlMatch[1].trim();
    console.log(`📡 MQTT Broker URL: ${mqttUrl}`);
    
    if (mqttUrl === 'ws://broker.hivemq.com:8000/mqtt') {
      console.log('✅ Using public MQTT broker (recommended for testing)');
    } else if (mqttUrl === 'ws://localhost:9001') {
      console.log('⚠️  Using local MQTT broker - make sure Docker is running');
      console.log('   Run: docker-compose up -d mqtt');
    } else {
      console.log('✅ Using custom MQTT broker');
    }
  }
} else {
  console.log('❌ MQTT configuration not found in .env file');
  console.log('📝 Adding MQTT configuration...');
  
  // Add MQTT configuration to .env file
  envContent += '\n\n# MQTT Configuration\n';
  envContent += 'MQTT_BROKER_URL=ws://broker.hivemq.com:8000/mqtt\n';
  envContent += 'MQTT_USERNAME=\n';
  envContent += 'MQTT_PASSWORD=\n';
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ MQTT configuration added to .env file');
}

console.log('');
console.log('🚀 Next Steps:');
console.log('1. Restart your backend server: npm run dev');
console.log('2. Check the logs for "✅ MQTT Bridge initialized successfully"');
console.log('3. Test the frontend to see MQTT status');
console.log('');
console.log('📚 For more options, see: MQTT_SETUP_GUIDE.md');
