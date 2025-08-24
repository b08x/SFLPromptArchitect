/**
 * @file authController.ts
 * @description Authentication controller handling user registration and login endpoints
 * This controller provides secure HTTP endpoints for user authentication operations
 * 
 * ENDPOINTS:
 * - POST /api/auth/register - User registration
 * - POST /api/auth/login - User login
 * - POST /api/auth/logout - User logout (token invalidation)
 * - GET /api/auth/me - Get current user info
 */

import { Request, Response } from 'express';
import authService, { registerSchema, loginSchema } from '../../services/authService';
import { z } from 'zod';

/**
 * Register a new user
 * 
 * @route POST /api/auth/register
 * @param req Express request containing email and password
 * @param res Express response with JWT token and user info
 * 
 * @security
 * - Input validation with Zod schemas
 * - Password strength requirements
 * - Secure error handling
 * - Rate limiting applied at route level
 * 
 * @example
 * POST /api/auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": "uuid-here",
 *     "email": "user@example.com"
 *   }
 * }
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    
    // Register user
    const result = await authService.register(validatedData);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });

  } catch (error: any) {
    console.error('Registration controller error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }

    // Handle known business logic errors
    if (error.message === 'User already exists with this email') {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'USER_ALREADY_EXISTS'
      });
      return;
    }

    // Handle generic errors
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
};

/**
 * Login user with email and password
 * 
 * @route POST /api/auth/login
 * @param req Express request containing email and password
 * @param res Express response with JWT token and user info
 * 
 * @security
 * - Input validation
 * - Secure password verification
 * - Rate limiting protection
 * - Consistent error responses
 * 
 * @example
 * POST /api/auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 * 
 * Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": "uuid-here",
 *     "email": "user@example.com"
 *   }
 * }
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    
    // Authenticate user
    const result = await authService.login(validatedData);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });

  } catch (error: any) {
    console.error('Login controller error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }

    // Handle authentication errors
    if (error.message === 'Invalid email or password') {
      res.status(401).json({
        success: false,
        error: error.message,
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Handle generic errors
    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
};

/**
 * Logout user (client-side token invalidation)
 * 
 * @route POST /api/auth/logout
 * @param req Express request (requires authentication)
 * @param res Express response confirming logout
 * 
 * @note In a stateless JWT system, logout is primarily handled client-side
 * by removing the token. For enhanced security, consider implementing 
 * a token blacklist for production use.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, we primarily rely on client-side token removal
    // For enhanced security, you could implement server-side token blacklisting here
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      note: 'Remove the token from client storage'
    });

  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
};

/**
 * Get current authenticated user information
 * 
 * @route GET /api/auth/me
 * @param req Express request (requires authentication)
 * @param res Express response with current user info
 * 
 * @security
 * - Requires valid JWT token
 * - Returns minimal user information
 * - No sensitive data exposure
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User information is attached by authMiddleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Return current user info (sensitive data already filtered by middleware)
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });

  } catch (error) {
    console.error('Get current user controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information',
      code: 'USER_INFO_ERROR'
    });
  }
};

/**
 * Health check endpoint for authentication service
 * 
 * @route GET /api/auth/health
 * @param req Express request
 * @param res Express response with service status
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Authentication service is healthy',
    timestamp: new Date().toISOString()
  });
};