# Migration Guide: From Single-Provider to Multi-Provider AI Service Architecture

## Overview

This guide outlines the migration steps for our unified AI service architecture, transitioning from provider-specific implementations to a flexible, provider-agnostic approach.

## What Changed

### Removed Components
- Provider-specific service implementations
- Hardcoded provider configurations
- Static AI model mappings
- Manual provider-switching logic

### New Components
- Unified AI Service Interface
- Dynamic Provider Configuration
- Standardized AI Request/Response Handling
- Provider-Agnostic Model Selection
- Intelligent Provider Routing
- Enhanced Error Handling for Multi-Provider Scenarios

### Modified Components
- `backend/src/app.ts` - Added security middleware, removed tempAuth
- `backend/src/api/routes.ts` - All routes now protected with authMiddleware
- `backend/src/types/express.ts` - Updated user type definition
- All existing controllers now receive real authenticated user data

## Step-by-Step Migration

### 1. Environment Setup

Update environment variables for multi-provider AI service:

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# AI Provider Configuration
GEMINI_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Provider Selection and Routing
DEFAULT_AI_PROVIDER=google  # google|openai|openrouter
PROVIDER_FALLBACK_ORDER=openai,openrouter

# Optional: Provider-Specific Settings
AI_REQUEST_TIMEOUT=30000  # 30 seconds
MAX_TOKENS=4096
TEMPERATURE=0.7
```

### 2. Install Dependencies

The following packages have been added:
```bash
npm install @ai-sdk/google @ai-sdk/openai @ai-sdk/openrouter
npm install @anthropic/sdk
npm install zod # For runtime type validation
npm install jose # For robust JWT handling
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

### 5. Update AI Service Routing

All AI generation routes now use unified provider interface:

**Before (Provider-Specific):**
```typescript
router.post('/gemini/generate', GeminiController.generate);
router.post('/openai/generate', OpenAIController.generate);
```

**After (Unified Routing):**
```typescript
router.post('/proxy/generate', authMiddleware, AIProxyController.generate);
// Dynamic provider selection and fallback mechanism
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

# 2. Test multi-provider AI generation
curl -X POST http://localhost:4000/proxy/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "provider": "google",
    "model": "gemini-1.5-pro",
    "prompt": "Write a Python function to calculate Fibonacci sequence",
    "parameters": {
      "temperature": 0.7,
      "maxTokens": 500
    }
  }'
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