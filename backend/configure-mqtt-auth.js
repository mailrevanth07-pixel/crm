/**
 * MQTT Authentication Configuration Script
 * Helps set up MQTT with username/password
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 MQTT Authentication Setup');
console.log('============================');
console.log('');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Please create one first.');
  process.exit(1);
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Function to ask question
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function configureMQTT() {
  console.log('Choose your MQTT broker option:');
  console.log('1. Public broker (no auth required) - Current setup');
  console.log('2. HiveMQ Cloud (requires signup)');
  console.log('3. EMQX Cloud (requires signup)');
  console.log('4. Local Docker broker (requires Docker)');
  console.log('5. Custom broker');
  console.log('');

  const choice = await askQuestion('Enter your choice (1-5): ');

  let brokerUrl = '';
  let username = '';
  let password = '';

  switch (choice) {
    case '1':
      brokerUrl = 'ws://broker.hivemq.com:8000/mqtt';
      username = '';
      password = '';
      console.log('✅ Using public MQTT broker (no authentication required)');
      break;

    case '2':
      console.log('📝 HiveMQ Cloud Setup:');
      console.log('1. Go to https://www.hivemq.com/cloud/');
      console.log('2. Sign up and create a cluster');
      console.log('3. Get your credentials from the dashboard');
      console.log('');
      brokerUrl = await askQuestion('Enter your HiveMQ broker URL (wss://your-cluster-id.hivemq.cloud:8884): ');
      username = await askQuestion('Enter your HiveMQ username: ');
      password = await askQuestion('Enter your HiveMQ password: ');
      break;

    case '3':
      console.log('📝 EMQX Cloud Setup:');
      console.log('1. Go to https://www.emqx.com/en/cloud');
      console.log('2. Create a deployment');
      console.log('3. Get your credentials');
      console.log('');
      brokerUrl = await askQuestion('Enter your EMQX broker URL (wss://your-deployment-id.emqx.cloud:8883): ');
      username = await askQuestion('Enter your EMQX username: ');
      password = await askQuestion('Enter your EMQX password: ');
      break;

    case '4':
      console.log('📝 Local Docker Setup:');
      console.log('1. Make sure Docker Desktop is running');
      console.log('2. Run: docker-compose up -d mqtt');
      console.log('');
      brokerUrl = 'ws://localhost:9001';
      username = await askQuestion('Enter username for local MQTT broker: ');
      password = await askQuestion('Enter password for local MQTT broker: ');
      break;

    case '5':
      brokerUrl = await askQuestion('Enter your custom MQTT broker URL: ');
      username = await askQuestion('Enter your username: ');
      password = await askQuestion('Enter your password: ');
      break;

    default:
      console.log('❌ Invalid choice. Using public broker.');
      brokerUrl = 'ws://broker.hivemq.com:8000/mqtt';
      username = '';
      password = '';
  }

  // Update .env file
  let updatedEnvContent = envContent;

  // Remove existing MQTT configuration
  updatedEnvContent = updatedEnvContent.replace(/# MQTT Configuration[\s\S]*?(?=\n\n|\n[A-Z]|$)/, '');

  // Add new MQTT configuration
  updatedEnvContent += '\n# MQTT Configuration\n';
  updatedEnvContent += `MQTT_BROKER_URL=${brokerUrl}\n`;
  updatedEnvContent += `MQTT_USERNAME=${username}\n`;
  updatedEnvContent += `MQTT_PASSWORD=${password}\n`;

  // Write updated .env file
  fs.writeFileSync(envPath, updatedEnvContent);

  console.log('');
  console.log('✅ MQTT configuration updated!');
  console.log(`📡 Broker URL: ${brokerUrl}`);
  console.log(`👤 Username: ${username || '(empty)'}`);
  console.log(`🔑 Password: ${password ? '***' : '(empty)'}`);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Restart your backend server: npm run dev');
  console.log('2. Check logs for MQTT connection status');
  console.log('3. Test the frontend to verify MQTT is working');

  rl.close();
}

configureMQTT().catch(console.error);
