# Migration Guide: From tempAuth to JWT Authentication

## Overview

This guide outlines the steps to migrate from the insecure `tempAuth.ts` middleware to the new JWT-based authentication system.

## What Changed

### Removed Components
- `backend/src/middleware/tempAuth.ts` - Completely removed
- Hardcoded system user injection - Replaced with real user authentication

### New Components
- `backend/src/middleware/authMiddleware.ts` - JWT validation middleware
- `backend/src/services/authService.ts` - Authentication business logic
- `backend/src/api/controllers/authController.ts` - Auth HTTP endpoints
- `backend/src/api/routes/auth.ts` - Authentication routes
- Security middleware (Helmet, CORS, Rate limiting)

### Modified Components
- `backend/src/app.ts` - Added security middleware, removed tempAuth
- `backend/src/api/routes.ts` - All routes now protected with authMiddleware
- `backend/src/types/express.ts` - Updated user type definition
- All existing controllers now receive real authenticated user data

## Step-by-Step Migration

### 1. Environment Setup

Create environment variables for JWT authentication:

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit with your values
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
FRONTEND_URL=http://localhost:3000
```

### 2. Install Dependencies

The following packages have been added:
```bash
npm install bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken express-rate-limit helmet cors @types/cors
```

### 3. Database Migration

Ensure your database has the users table:
```sql
-- This should already exist from migration 001_initial_schema.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4. Remove tempAuth References

The following changes have been made automatically:

**Removed from `app.ts`:**
```typescript
// OLD - REMOVED
import tempAuthMiddleware from './middleware/tempAuth';
app.use('/api', tempAuthMiddleware);
```

**New in `app.ts`:**
```typescript
// NEW - ADDED
import helmet from 'helmet';
import cors from 'cors';

app.use(helmet({...}));
app.use(cors({...}));
```

### 5. Update Route Protection

All API routes are now protected with `authMiddleware`:

**Before (tempAuth):**
```typescript
router.post('/prompts', PromptController.createPrompt);
// All requests had hardcoded system user
```

**After (JWT Auth):**
```typescript
router.post('/prompts', authMiddleware, PromptController.createPrompt);
// Only authenticated users can access
```

### 6. Service Layer Changes

Your existing services (like `PromptService`) now receive real user IDs:

**Before:**
```typescript
// Always received hardcoded system user ID
req.user.id // '00000000-0000-0000-0000-000000000001'
```

**After:**
```typescript
// Receives actual authenticated user ID
req.user.id // Real UUID from JWT token
req.user.email // Real user email
```

No changes needed in your service methods - they continue to work the same way!

### 7. Frontend Integration

Update your frontend application to handle authentication:

#### Login Flow
```javascript
// 1. User registration
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'StrongPass123!'
  })
});

const { token } = await registerResponse.json();
localStorage.setItem('jwt_token', token);

// 2. Or user login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'StrongPass123!'
  })
});
```

#### Authenticated Requests
```javascript
// All API calls now need Authorization header
const token = localStorage.getItem('jwt_token');

const response = await fetch('/api/prompts', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

if (response.status === 401) {
  // Token expired or invalid - redirect to login
  localStorage.removeItem('jwt_token');
  window.location.href = '/login';
}
```

#### Token Management
```javascript
// Check if token exists and is valid
const checkAuth = async () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return false;

  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Logout
const logout = () => {
  localStorage.removeItem('jwt_token');
  window.location.href = '/login';
};
```

### 8. Error Handling Updates

Update your frontend error handling for authentication:

```javascript
// Handle authentication errors
const handleApiResponse = async (response) => {
  if (response.status === 401) {
    // Unauthorized - token expired or invalid
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
    return;
  }
  
  if (response.status === 429) {
    // Rate limited
    throw new Error('Too many requests. Please try again later.');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};
```

### 9. Development Workflow

For development and testing:

```bash
# 1. Start the backend
cd backend
npm run dev

# 2. Test authentication endpoints
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"StrongPass123!"}'

# 3. Use returned token for API calls
curl -X GET http://localhost:3001/api/prompts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 10. Testing

Run the test suite to verify authentication works:

```bash
npm test
```

Tests cover:
- User registration and login
- JWT token validation
- Protected route access
- Rate limiting
- Password security requirements

## Breaking Changes

### API Access
- **All API endpoints now require authentication**
- Frontend must implement login/registration UI
- All API calls must include `Authorization: Bearer <token>` header

### User Context
- Controllers now receive real user data instead of hardcoded system user
- User isolation is enforced (users only see their own data)
- No more shared system user across all requests

### Error Responses
- New error codes and messages for authentication failures
- Rate limiting responses (HTTP 429)
- More detailed validation error messages

## Rollback Plan

If issues arise, you can temporarily rollback by:

1. Restore `tempAuth.ts` middleware
2. Remove `authMiddleware` from routes
3. Revert `app.ts` changes

However, this should only be done for emergency situations as it reintroduces the security vulnerability.

## Production Checklist

Before deploying to production:

- [ ] Set secure JWT_SECRET (min 32 characters, cryptographically random)
- [ ] Configure FRONTEND_URL for production domain
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Set up monitoring for authentication failures
- [ ] Test all authentication flows
- [ ] Verify rate limiting works correctly
- [ ] Review security headers configuration
- [ ] Test password complexity requirements

## Support

If you encounter issues during migration:

1. Check the console for detailed error messages
2. Verify environment variables are set correctly
3. Ensure database users table exists
4. Test authentication endpoints directly with curl/Postman
5. Review the test suite for expected behavior examples