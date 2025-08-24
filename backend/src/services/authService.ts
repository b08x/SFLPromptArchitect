/**
 * @file authService.ts
 * @description Authentication service handling user registration, login, and JWT token management
 * This service implements secure password hashing, user validation, and JWT generation
 * 
 * SECURITY FEATURES:
 * - bcrypt password hashing with configurable salt rounds
 * - JWT token generation with expiration
 * - Input validation and sanitization
 * - Secure error handling without information leakage
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import getPool from '../config/database';

// Configuration constants
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Input validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required')
});

// Type definitions
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
  hashed_password: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Authentication Service Class
 * Handles all authentication-related operations including registration and login
 */
class AuthService {
  /**
   * Register a new user with secure password hashing
   * 
   * @param userData User registration data
   * @returns Promise resolving to authentication response with JWT token
   * @throws Error if user already exists or validation fails
   * 
   * @security
   * - Password strength validation
   * - bcrypt hashing with high salt rounds
   * - Email uniqueness validation
   * - Input sanitization
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Validate input data
    const validatedData = registerSchema.parse(userData);
    const { email, password } = validatedData;

    try {
      // Check if user already exists
      const pool = await getPool();
      const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
      const existingUser = await pool.query(existingUserQuery, [email.toLowerCase()]);

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists with this email');
      }

      // Hash password securely
      const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      // Create new user
      const insertUserQuery = `
        INSERT INTO users (email, hashed_password, created_at, updated_at) 
        VALUES ($1, $2, NOW(), NOW()) 
        RETURNING id, email, created_at
      `;
      
      const newUserResult = await pool.query(insertUserQuery, [
        email.toLowerCase(),
        hashedPassword
      ]);

      const newUser = newUserResult.rows[0];

      // Generate JWT token
      const token = this.generateToken(newUser.id, newUser.email);

      return {
        token,
        user: {
          id: newUser.id,
          email: newUser.email
        }
      };

    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Re-throw validation errors
      if (error.message === 'User already exists with this email') {
        throw error;
      }
      
      // Generic error for database issues
      throw new Error('Registration failed. Please try again.');
    }
  }

  /**
   * Authenticate user login with secure password verification
   * 
   * @param loginData User login credentials
   * @returns Promise resolving to authentication response with JWT token
   * @throws Error if credentials are invalid
   * 
   * @security
   * - Secure password comparison using bcrypt
   * - Consistent timing to prevent user enumeration
   * - Rate limiting applied at route level
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    // Validate input data
    const validatedData = loginSchema.parse(loginData);
    const { email, password } = validatedData;

    try {
      // Retrieve user from database
      const pool = await getPool();
      const userQuery = 'SELECT id, email, hashed_password FROM users WHERE email = $1';
      const userResult = await pool.query(userQuery, [email.toLowerCase()]);

      // Use consistent timing whether user exists or not (prevents user enumeration)
      const user = userResult.rows[0];
      const hashedPassword = user?.hashed_password || '$2b$12$dummy.hash.to.prevent.timing.attacks.1234567890';

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, hashedPassword);

      if (!user || !isPasswordValid) {
        // Consistent error message for both cases
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken(user.id, user.email);

      return {
        token,
        user: {
          id: user.id,
          email: user.email
        }
      };

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Re-throw authentication errors
      if (error.message === 'Invalid email or password') {
        throw error;
      }
      
      // Generic error for other issues
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Generate JWT token for authenticated user
   * 
   * @param userId User ID to include in token
   * @param email User email to include in token
   * @returns Signed JWT token string
   * 
   * @private
   * @security
   * - Includes expiration time
   * - Uses secure secret
   * - Minimal payload to reduce token size
   */
  private generateToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
    };

    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256'
    } as jwt.SignOptions);
  }

  /**
   * Verify if a JWT token is valid
   * 
   * @param token JWT token to verify
   * @returns Decoded token payload or null if invalid
   * 
   * @security
   * - Verifies signature and expiration
   * - Graceful error handling
   */
  async verifyToken(token: string): Promise<any | null> {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error: any) {
      console.warn('Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Get user by ID (for middleware user validation)
   * 
   * @param userId User ID to retrieve
   * @returns User object or null if not found
   */
  async getUserById(userId: string): Promise<Pick<User, 'id' | 'email'> | null> {
    try {
      const pool = await getPool();
      const userQuery = 'SELECT id, email FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      
      return userResult.rows[0] || null;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new AuthService();