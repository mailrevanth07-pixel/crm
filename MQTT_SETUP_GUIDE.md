# MQTT Setup Guide for CRM System

## Overview
This guide explains how to set up MQTT for the CRM system's hybrid realtime architecture. MQTT provides better mobile reliability compared to WebSockets alone.

## Option 1: Local Development with Docker

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed

### Steps
1. **Start the MQTT broker:**
   ```bash
   cd backend
   docker-compose up -d mqtt
   ```

2. **Test the connection:**
   ```bash
   node test-mqtt.js
   ```

3. **Start the backend:**
   ```bash
   npm run dev
   ```

4. **Start the frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```

## Option 2: Cloud MQTT Broker (Recommended for Production)

### Using HiveMQ Cloud (Free Tier)
1. Sign up at [HiveMQ Cloud](https://www.hivemq.com/cloud/)
2. Create a new cluster
3. Get your broker URL and credentials
4. Update environment variables:

   **Backend (.env):**
   ```
   MQTT_BROKER_URL=wss://your-cluster-id.hivemq.cloud:8884
   MQTT_USERNAME=your-username
   MQTT_PASSWORD=your-password
   ```

   **Frontend (.env.local):**
   ```
   NEXT_PUBLIC_MQTT_BROKER_URL=wss://your-cluster-id.hivemq.cloud:8884
   NEXT_PUBLIC_MQTT_USERNAME=your-username
   NEXT_PUBLIC_MQTT_PASSWORD=your-password
   ```

### Using EMQX Cloud (Free Tier)
1. Sign up at [EMQX Cloud](https://www.emqx.com/en/cloud)
2. Create a new deployment
3. Get your broker URL and credentials
4. Update environment variables as above

## Option 3: Self-Hosted MQTT Broker

### Using Mosquitto (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients

# Start the service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Test connection
mosquitto_pub -h localhost -t "test/topic" -m "Hello MQTT"
mosquitto_sub -h localhost -t "test/topic"
```

## Testing the Setup

### 1. Test MQTT Connection
```bash
cd backend
node test-mqtt.js
```

### 2. Test Backend Integration
```bash
cd backend
npm run dev
# Check logs for "✅ MQTT Bridge initialized successfully"
```

### 3. Test Frontend Integration
```bash
cd frontend
npm run dev
# Open browser console and look for MQTT connection messages
```

## MQTT Topics Used

The system uses the following topic structure:

- `crm/leads/{leadId}/created` - Lead creation events
- `crm/leads/{leadId}/updated` - Lead update events  
- `crm/leads/{leadId}/assigned` - Lead assignment events
- `crm/activities/{activityId}/created` - Activity creation events
- `crm/users/{userId}/presence` - User presence events
- `crm/notifications/{notificationId}` - System notifications
- `crm/notes/{noteId}/collaboration` - Collaborative editing events

## Troubleshooting

### Common Issues

1. **Docker not running:**
   - Start Docker Desktop
   - Wait for it to fully load before running docker-compose

2. **MQTT connection failed:**
   - Check if the broker URL is correct
   - Verify credentials are set properly
   - Ensure the broker is accessible from your network

3. **WebSocket connection issues:**
   - Make sure the broker supports WebSockets
   - Check if the port is correct (usually 9001 for WebSockets)

4. **Mobile connection issues:**
   - MQTT should work better on mobile than WebSockets
   - Check if the mobile device can reach the broker
   - Consider using a cloud broker for better mobile connectivity

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=mqtt*
```

## Production Considerations

1. **Security:**
   - Use TLS/SSL for MQTT connections
   - Implement proper authentication
   - Use strong passwords

2. **Scalability:**
   - Use a managed MQTT broker for production
   - Consider clustering for high availability
   - Monitor connection limits

3. **Monitoring:**
   - Set up monitoring for MQTT broker health
   - Monitor connection counts and message rates
   - Set up alerts for connection failures

## Next Steps

1. Set up your preferred MQTT broker
2. Update environment variables
3. Test the connection
4. Deploy to production with proper security settings
