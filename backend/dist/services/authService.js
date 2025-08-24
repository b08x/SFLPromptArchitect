"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const database_1 = __importDefault(require("../config/database"));
// Configuration constants
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// Input validation schemas
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').min(1, 'Email is required'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').min(1, 'Email is required'),
    password: zod_1.z.string().min(1, 'Password is required')
});
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
    register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate input data
            const validatedData = exports.registerSchema.parse(userData);
            const { email, password } = validatedData;
            try {
                // Check if user already exists
                const pool = yield (0, database_1.default)();
                const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
                const existingUser = yield pool.query(existingUserQuery, [email.toLowerCase()]);
                if (existingUser.rows.length > 0) {
                    throw new Error('User already exists with this email');
                }
                // Hash password securely
                const hashedPassword = yield bcryptjs_1.default.hash(password, BCRYPT_SALT_ROUNDS);
                // Create new user
                const insertUserQuery = `
        INSERT INTO users (email, hashed_password, created_at, updated_at) 
        VALUES ($1, $2, NOW(), NOW()) 
        RETURNING id, email, created_at
      `;
                const newUserResult = yield pool.query(insertUserQuery, [
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
            }
            catch (error) {
                console.error('Registration error:', error);
                // Re-throw validation errors
                if (error.message === 'User already exists with this email') {
                    throw error;
                }
                // Generic error for database issues
                throw new Error('Registration failed. Please try again.');
            }
        });
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
    login(loginData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate input data
            const validatedData = exports.loginSchema.parse(loginData);
            const { email, password } = validatedData;
            try {
                // Retrieve user from database
                const pool = yield (0, database_1.default)();
                const userQuery = 'SELECT id, email, hashed_password FROM users WHERE email = $1';
                const userResult = yield pool.query(userQuery, [email.toLowerCase()]);
                // Use consistent timing whether user exists or not (prevents user enumeration)
                const user = userResult.rows[0];
                const hashedPassword = (user === null || user === void 0 ? void 0 : user.hashed_password) || '$2b$12$dummy.hash.to.prevent.timing.attacks.1234567890';
                // Verify password
                const isPasswordValid = yield bcryptjs_1.default.compare(password, hashedPassword);
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
            }
            catch (error) {
                console.error('Login error:', error);
                // Re-throw authentication errors
                if (error.message === 'Invalid email or password') {
                    throw error;
                }
                // Generic error for other issues
                throw new Error('Login failed. Please try again.');
            }
        });
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
    generateToken(userId, email) {
        const payload = {
            userId,
            email,
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            algorithm: 'HS256'
        });
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
    verifyToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return jsonwebtoken_1.default.verify(token, JWT_SECRET);
            }
            catch (error) {
                console.warn('Token verification failed:', error.message);
                return null;
            }
        });
    }
    /**
     * Get user by ID (for middleware user validation)
     *
     * @param userId User ID to retrieve
     * @returns User object or null if not found
     */
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield (0, database_1.default)();
                const userQuery = 'SELECT id, email FROM users WHERE id = $1';
                const userResult = yield pool.query(userQuery, [userId]);
                return userResult.rows[0] || null;
            }
            catch (error) {
                console.error('Get user by ID error:', error);
                return null;
            }
        });
    }
}
// Export singleton instance
exports.default = new AuthService();
