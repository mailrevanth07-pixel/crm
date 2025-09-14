# Socket.IO Client Integration Guide

This guide shows how to integrate Socket.IO client with the CRM backend for real-time updates.

## Installation

```bash
npm install socket.io-client
```

## Basic Connection

```javascript
import io from 'socket.io-client';

// Connect to the server
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_access_token'
  }
});

// Handle connection
socket.on('connect', (data) => {
  console.log('Connected to server:', data);
  // data contains: { message, userId, userRole }
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Handle authentication errors
  if (error.message === 'Authentication token required') {
    // Redirect to login or refresh token
  }
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## Lead Subscription

```javascript
// Subscribe to a specific lead
socket.emit('lead:subscribe', { leadId: 'lead-uuid-here' });

// Handle subscription confirmation
socket.on('lead:subscribed', (data) => {
  console.log('Subscribed to lead:', data.leadId);
});

// Unsubscribe from a lead
socket.emit('lead:unsubscribe', { leadId: 'lead-uuid-here' });

// Handle unsubscription confirmation
socket.on('lead:unsubscribed', (data) => {
  console.log('Unsubscribed from lead:', data.leadId);
});
```

## Real-time Events

### Lead Events

```javascript
// Listen for lead creation (global)
socket.on('lead:created', (data) => {
  console.log('New lead created:', data.lead);
  console.log('Created by:', data.createdBy);
  console.log('Timestamp:', data.timestamp);
  
  // Update your UI with the new lead
  addLeadToList(data.lead);
});

// Listen for lead updates (global + lead-specific)
socket.on('lead:updated', (data) => {
  console.log('Lead updated:', data.lead);
  console.log('Updated by:', data.updatedBy);
  
  // Update the lead in your UI
  updateLeadInList(data.lead);
});

// Listen for lead deletion (global + lead-specific)
socket.on('lead:deleted', (data) => {
  console.log('Lead deleted:', data.leadId);
  console.log('Deleted by:', data.deletedBy);
  
  // Remove the lead from your UI
  removeLeadFromList(data.leadId);
});

// Listen for lead assignment (global + lead-specific)
socket.on('lead:assigned', (data) => {
  console.log('Lead assigned:', data.lead);
  console.log('Previous owner:', data.previousOwnerId);
  console.log('Assigned by:', data.assignedBy);
  
  // Update the lead in your UI
  updateLeadInList(data.lead);
});
```

### Activity Events

```javascript
// Listen for activity creation (lead-specific only)
socket.on('activity:created', (data) => {
  console.log('New activity created:', data.activity);
  console.log('Lead ID:', data.leadId);
  console.log('Created by:', data.createdBy);
  
  // Add activity to the lead's activity list
  addActivityToLead(data.leadId, data.activity);
});
```

## React Hook Example

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3001', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, connected };
};

export const useLeadSubscription = (socket, leadId) => {
  useEffect(() => {
    if (!socket || !leadId) return;

    // Subscribe to lead
    socket.emit('lead:subscribe', { leadId });

    // Handle events
    const handleLeadUpdated = (data) => {
      console.log('Lead updated:', data);
      // Update your state here
    };

    const handleActivityCreated = (data) => {
      console.log('New activity:', data);
      // Update your state here
    };

    socket.on('lead:updated', handleLeadUpdated);
    socket.on('activity:created', handleActivityCreated);

    return () => {
      socket.emit('lead:unsubscribe', { leadId });
      socket.off('lead:updated', handleLeadUpdated);
      socket.off('activity:created', handleActivityCreated);
    };
  }, [socket, leadId]);
};
```

## Vue.js Composition API Example

```javascript
import { ref, onMounted, onUnmounted } from 'vue';
import io from 'socket.io-client';

export function useSocket(token) {
  const socket = ref(null);
  const connected = ref(false);

  onMounted(() => {
    if (!token) return;

    socket.value = io('http://localhost:3001', {
      auth: { token }
    });

    socket.value.on('connect', () => {
      connected.value = true;
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
    });
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close();
    }
  });

  return { socket, connected };
}
```

## Error Handling

```javascript
// Handle socket errors
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  
  switch (error.message) {
    case 'Lead ID is required':
      console.error('Invalid lead subscription request');
      break;
    case 'Authentication token required':
      console.error('Please log in again');
      // Redirect to login
      break;
    default:
      console.error('Unknown socket error');
  }
});

// Handle connection errors
socket.on('connect_error', (error) => {
  if (error.message === 'Invalid authentication token') {
    // Token expired, try to refresh
    refreshToken().then(newToken => {
      socket.auth.token = newToken;
      socket.connect();
    });
  }
});
```

## Room Management

```javascript
// The server automatically joins users to these rooms:
// - user:<userId> - Personal notifications
// - org:global - Organization-wide updates

// You can subscribe to specific leads:
socket.emit('lead:subscribe', { leadId: 'lead-123' });

// And unsubscribe when no longer needed:
socket.emit('lead:unsubscribe', { leadId: 'lead-123' });
```

## Event Data Structure

### Lead Events
```javascript
{
  lead: {
    id: "uuid",
    title: "Lead Title",
    status: "NEW",
    owner: { id: "uuid", name: "John", email: "john@example.com" },
    // ... other lead properties
  },
  createdBy: { id: "uuid", email: "user@example.com", role: "SALES" },
  timestamp: "2023-12-01T00:00:00.000Z"
}
```

### Activity Events
```javascript
{
  activity: {
    id: "uuid",
    type: "NOTE",
    body: "Activity description",
    creator: { id: "uuid", name: "John", email: "john@example.com" },
    // ... other activity properties
  },
  leadId: "uuid",
  createdBy: { id: "uuid", email: "user@example.com", role: "SALES" },
  timestamp: "2023-12-01T00:00:00.000Z"
}
```

## Production Considerations

1. **Token Refresh**: Implement automatic token refresh when connection fails
2. **Reconnection**: Handle automatic reconnection with exponential backoff
3. **Error Boundaries**: Wrap socket logic in error boundaries
4. **Memory Management**: Unsubscribe from rooms when components unmount
5. **Rate Limiting**: Be mindful of event frequency in high-traffic scenarios

## Redis Scaling (Future)

For production scaling, the server includes a Redis adapter placeholder:

```javascript
// In socketHandler.ts - uncomment when ready for scaling
// adapter: createAdapter(redisClient, redisClient.duplicate())
```

This allows multiple server instances to share socket state through Redis.

