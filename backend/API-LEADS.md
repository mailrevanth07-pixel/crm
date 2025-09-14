# Leads and Activities API Documentation

This document describes the leads and activities endpoints for the CRM backend.

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## Leads API

### GET /api/leads
Get paginated list of leads with optional filtering.

**Query Parameters:**
- `owner` (optional): Filter by owner ID (UUID)
- `status` (optional): Filter by status (NEW, CONTACTED, QUALIFIED, CLOSED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Example Request:**
```bash
GET /api/leads?status=NEW&page=1&limit=5
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "uuid",
        "title": "New Lead",
        "description": "Lead description",
        "status": "NEW",
        "source": "Website",
        "ownerId": "uuid",
        "metadata": {},
        "createdAt": "2023-12-01T00:00:00.000Z",
        "updatedAt": "2023-12-01T00:00:00.000Z",
        "owner": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### GET /api/leads/:id
Get a single lead with owner and activities.

**Path Parameters:**
- `id`: Lead ID (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "lead": {
      "id": "uuid",
      "title": "Lead Title",
      "description": "Lead description",
      "status": "NEW",
      "source": "Website",
      "ownerId": "uuid",
      "metadata": {},
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z",
      "owner": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "activities": [
        {
          "id": "uuid",
          "leadId": "uuid",
          "type": "NOTE",
          "body": "Activity description",
          "createdBy": "uuid",
          "createdAt": "2023-12-01T00:00:00.000Z",
          "updatedAt": "2023-12-01T00:00:00.000Z",
          "creator": {
            "id": "uuid",
            "name": "John Doe",
            "email": "john@example.com"
          }
        }
      ]
    }
  }
}
```

### POST /api/leads
Create a new lead.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Lead Title",
  "description": "Lead description (optional)",
  "status": "NEW",
  "source": "Website (optional)",
  "ownerId": "uuid (optional)",
  "metadata": {} // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "lead": {
      "id": "uuid",
      "title": "Lead Title",
      "description": "Lead description",
      "status": "NEW",
      "source": "Website",
      "ownerId": "uuid",
      "metadata": {},
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z",
      "owner": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Socket Event:** `lead:created`

### PUT /api/leads/:id
Update a lead.

**Authentication:** Required

**Path Parameters:**
- `id`: Lead ID (UUID)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "CONTACTED",
  "source": "Updated source",
  "ownerId": "uuid",
  "metadata": {}
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": {
    "lead": {
      "id": "uuid",
      "title": "Updated Title",
      "description": "Updated description",
      "status": "CONTACTED",
      "source": "Updated source",
      "ownerId": "uuid",
      "metadata": {},
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z",
      "owner": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Socket Event:** `lead:updated`

### DELETE /api/leads/:id
Delete a lead.

**Authentication:** Required

**Path Parameters:**
- `id`: Lead ID (UUID)

**Response (200):**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

**Socket Event:** `lead:deleted`

### POST /api/leads/:id/assign
Assign a lead to an owner.

**Authentication:** Required

**Path Parameters:**
- `id`: Lead ID (UUID)

**Request Body:**
```json
{
  "ownerId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lead assigned successfully",
  "data": {
    "lead": {
      "id": "uuid",
      "title": "Lead Title",
      "description": "Lead description",
      "status": "NEW",
      "source": "Website",
      "ownerId": "uuid",
      "metadata": {},
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z",
      "owner": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Socket Event:** `lead:assigned`

## Activities API

### GET /api/leads/:id/activities
Get activities for a specific lead.

**Path Parameters:**
- `id`: Lead ID (UUID)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "leadId": "uuid",
        "type": "NOTE",
        "body": "Activity description",
        "createdBy": "uuid",
        "createdAt": "2023-12-01T00:00:00.000Z",
        "updatedAt": "2023-12-01T00:00:00.000Z",
        "creator": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ]
  }
}
```

### POST /api/leads/:id/activities
Create an activity for a lead.

**Authentication:** Required

**Path Parameters:**
- `id`: Lead ID (UUID)

**Request Body:**
```json
{
  "type": "NOTE",
  "body": "Activity description"
}
```

**Activity Types:**
- `NOTE`: Text note
- `CALL`: Phone call record
- `EMAIL`: Email communication

**Response (201):**
```json
{
  "success": true,
  "message": "Activity created successfully",
  "data": {
    "activity": {
      "id": "uuid",
      "leadId": "uuid",
      "type": "NOTE",
      "body": "Activity description",
      "createdBy": "uuid",
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z",
      "creator": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Socket Event:** `activity:created`

## Socket.IO Real-time Events

### Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_access_token'
  }
});

// Handle connection
socket.on('connect', (data) => {
  console.log('Connected:', data);
  // data contains: { message, userId, userRole }
});
```

### Client Events
- `lead:subscribe` - Subscribe to a specific lead
- `lead:unsubscribe` - Unsubscribe from a lead

### Server Events
- `lead:created` - New lead created (emitted to `org:global`)
- `lead:updated` - Lead updated (emitted to `lead:<leadId>` and `org:global`)
- `lead:deleted` - Lead deleted (emitted to `lead:<leadId>` and `org:global`)
- `lead:assigned` - Lead assigned to new owner (emitted to `lead:<leadId>` and `org:global`)
- `activity:created` - New activity created (emitted to `lead:<leadId>` only)

### Room Management
The server automatically manages these rooms:
- `org:global` - Organization-wide updates
- `user:<userId>` - Personal notifications
- `lead:<leadId>` - Lead-specific updates

### Example Usage
```javascript
// Subscribe to a lead
socket.emit('lead:subscribe', { leadId: 'lead-uuid' });

// Listen for events
socket.on('lead:created', (data) => {
  console.log('New lead created:', data.lead);
  console.log('Created by:', data.createdBy);
});

socket.on('lead:updated', (data) => {
  console.log('Lead updated:', data.lead);
  console.log('Updated by:', data.updatedBy);
});

socket.on('activity:created', (data) => {
  console.log('New activity:', data.activity);
  console.log('For lead:', data.leadId);
});

// Unsubscribe from lead
socket.emit('lead:unsubscribe', { leadId: 'lead-uuid' });
```

### Event Data Structure
```javascript
// Lead events
{
  lead: { /* lead object */ },
  createdBy: { id: "uuid", email: "user@example.com", role: "SALES" },
  timestamp: "2023-12-01T00:00:00.000Z"
}

// Activity events
{
  activity: { /* activity object */ },
  leadId: "uuid",
  createdBy: { id: "uuid", email: "user@example.com", role: "SALES" },
  timestamp: "2023-12-01T00:00:00.000Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Lead not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch leads"
}
```

## Validation Rules

### Lead Validation
- `title`: Required, 1-255 characters
- `description`: Optional, max 1000 characters
- `status`: Optional, must be one of: NEW, CONTACTED, QUALIFIED, CLOSED
- `source`: Optional, max 100 characters
- `ownerId`: Optional, must be valid UUID
- `metadata`: Optional, must be valid object

### Activity Validation
- `type`: Required, must be one of: NOTE, CALL, EMAIL
- `body`: Optional, max 2000 characters

### Query Parameters
- `page`: Optional, integer >= 1, default: 1
- `limit`: Optional, integer 1-100, default: 10
- `owner`: Optional, valid UUID
- `status`: Optional, must be one of: NEW, CONTACTED, QUALIFIED, CLOSED
