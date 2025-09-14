# Authentication API Documentation

This document describes the authentication endpoints and middleware for the CRM backend.

## Environment Variables

Make sure to set these environment variables in your `.env` file:

```env
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_make_it_different_and_secure
```

## Authentication Endpoints

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "SALES" // Optional: ADMIN, MANAGER, or SALES (default: SALES)
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SALES",
      "createdAt": "2023-12-01T00:00:00.000Z"
    }
  }
}
```

### POST /api/auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SALES",
      "createdAt": "2023-12-01T00:00:00.000Z"
    }
  }
}
```

### POST /api/auth/refresh

Refresh an access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SALES",
      "createdAt": "2023-12-01T00:00:00.000Z"
    }
  }
}
```

### POST /api/auth/logout

Logout and invalidate refresh token.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET /api/auth/profile

Get current user profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SALES",
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z"
    }
  }
}
```

## Middleware

### authMiddleware

Verifies JWT access token and attaches user information to `req.user`.

**Usage:**
```typescript
import { authMiddleware } from './middleware/auth';

app.get('/protected-route', authMiddleware, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

**Request Object:**
```typescript
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
```

### roleGuard

Checks if user has required role(s).

**Usage:**
```typescript
import { roleGuard } from './middleware/auth';

// Admin only
app.get('/admin-route', authMiddleware, roleGuard(['ADMIN']), handler);

// Admin or Manager
app.get('/management-route', authMiddleware, roleGuard(['ADMIN', 'MANAGER']), handler);
```

## Token Management

### Access Tokens
- **Expiry:** 15 minutes
- **Secret:** `JWT_SECRET` environment variable
- **Type:** JWT with user information

### Refresh Tokens
- **Expiry:** 7 days
- **Secret:** `JWT_REFRESH_SECRET` environment variable
- **Storage:** Stored in `RefreshTokens` table
- **Type:** JWT with user information

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Registration failed"
}
```

## Example Usage

### Frontend Integration

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }
  return data;
};

// Make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, try to refresh
    await refreshToken();
    // Retry request
  }
  
  return response;
};

// Refresh token
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
  } else {
    // Redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};
```

## Security Features

1. **Password Hashing:** Passwords are hashed using bcrypt with salt rounds of 10
2. **JWT Tokens:** Secure token-based authentication
3. **Refresh Token Rotation:** Refresh tokens are stored in database and can be invalidated
4. **Role-Based Access:** Fine-grained permission control
5. **Token Expiry:** Short-lived access tokens with longer-lived refresh tokens
6. **Input Validation:** Comprehensive request validation
7. **Error Handling:** Secure error messages without information leakage
