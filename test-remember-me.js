const jwt = require('jsonwebtoken');

// Test tokens with different remember me settings
const testRememberMe = () => {
  const payload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'ADMIN',
    type: 'access'
  };

  // Simulate regular token (1 hour)
  const regularToken = jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
  
  // Simulate remember me token (24 hours)
  const rememberMeToken = jwt.sign(payload, 'test-secret', { expiresIn: '24h' });

  // Decode tokens to check expiration
  const regularDecoded = jwt.decode(regularToken);
  const rememberMeDecoded = jwt.decode(rememberMeToken);

  console.log('Regular token expiration:', new Date(regularDecoded.exp * 1000));
  console.log('Remember me token expiration:', new Date(rememberMeDecoded.exp * 1000));
  
  const regularExpiry = new Date(regularDecoded.exp * 1000);
  const rememberMeExpiry = new Date(rememberMeDecoded.exp * 1000);
  
  console.log('Time difference (hours):', (rememberMeExpiry - regularExpiry) / (1000 * 60 * 60));
};

testRememberMe();
