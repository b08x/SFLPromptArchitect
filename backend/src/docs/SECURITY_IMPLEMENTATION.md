# JWT Authentication Security Implementation

## Overview

This document outlines the secure JWT-based authentication system that replaces the insecure temporary authentication middleware in SFL Prompt Studio.

## Security Improvements

### Previous Security Vulnerability
- **Issue**: `tempAuth.ts` hardcoded a system user for all requests
- **Risk Level**: CRITICAL
- **Impact**: Any user could access all system functionality with admin privileges

### New Security Implementation
- **JWT-based authentication** with secure token validation
- **bcrypt password hashing** with configurable salt rounds (default: 12)
- **Rate limiting** on authentication endpoints
- **Input validation** using Zod schemas
- **Security headers** via Helmet middleware
- **CORS protection** with configurable origins

## Architecture

### Authentication Flow
1. User registers with email/password → password hashed with bcrypt
2. User logs in → credentials validated → JWT token issued
3. Client includes JWT in Authorization header for protected routes
4. Middleware validates JWT and attaches user info to request

### Components

#### AuthService (`/src/services/authService.ts`)
- Handles user registration and login logic
- Password strength validation and hashing
- JWT token generation and verification
- Secure error handling

#### AuthMiddleware (`/src/middleware/authMiddleware.ts`)
- Validates JWT tokens from Authorization header
- Attaches authenticated user info to requests
- Rate limiting protection

#### AuthController (`/src/api/controllers/authController.ts`)
- HTTP endpoints for authentication operations
- Input validation and error handling
- Proper HTTP status codes

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/health` - Service health check

### Protected Endpoints
All existing API endpoints now require valid JWT tokens:
- All `/api/prompts/*` routes
- All `/api/workflows/*` routes
- All `/api/models/*` routes
- All `/api/gemini/*` routes
- All `/api/providers/*` routes
- All `/api/proxy/*` routes

## Security Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Rate Limiting
- **Authentication endpoints**: 5 attempts per 15 minutes
- **General endpoints**: 20 requests per 15 minutes

## Security Headers

### Helmet Configuration
- Content Security Policy (CSP)
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

### CORS Configuration
- Configurable origin whitelist
- Credential support for authenticated requests
- Specific allowed methods and headers

## Migration Steps

### 1. Update Environment Variables
```bash
cp backend/.env.example backend/.env
# Edit .env with your secure values
```

### 2. Remove Temporary Auth
The `tempAuth.ts` middleware has been completely removed and replaced.

### 3. Update Client Applications
Client applications must now:
- Register/login to obtain JWT tokens
- Include `Authorization: Bearer <token>` header in all API requests
- Handle authentication errors (401, 403)

### Example Client Usage
```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await loginResponse.json();

// Authenticated request
const response = await fetch('/api/prompts', {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple security layers (input validation, authentication, authorization, rate limiting)
2. **Principle of Least Privilege**: Users only access resources they own
3. **Secure Password Storage**: bcrypt with high salt rounds
4. **Token Expiration**: JWTs expire after 24 hours (configurable)
5. **Input Validation**: All inputs validated with Zod schemas
6. **Error Handling**: Consistent error responses without information leakage
7. **Rate Limiting**: Prevents brute force attacks
8. **Security Headers**: Protection against common web vulnerabilities

## Monitoring and Logging

- Authentication attempts logged
- Failed login attempts tracked for security analysis
- JWT validation errors logged
- Rate limit violations logged

## Production Deployment Checklist

- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Set strong SESSION_SECRET
- [ ] Configure FRONTEND_URL for production domain
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS in production
- [ ] Review and adjust rate limits
- [ ] Set up monitoring for authentication failures
- [ ] Regular security updates for dependencies

## Testing

Authentication system includes:
- Unit tests for authentication service
- Integration tests for auth endpoints
- Security tests for rate limiting
- JWT validation tests

Run tests with:
```bash
npm test
```