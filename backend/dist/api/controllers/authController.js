"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.getCurrentUser = exports.logout = exports.login = exports.register = void 0;
const authService_1 = __importStar(require("../../services/authService"));
const zod_1 = require("zod");
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
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate request body
        const validatedData = authService_1.registerSchema.parse(req.body);
        // Register user
        const result = yield authService_1.default.register(validatedData);
        // Return success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Registration controller error:', error);
        // Handle validation errors
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.issues.map((err) => ({
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
});
exports.register = register;
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
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate request body
        const validatedData = authService_1.loginSchema.parse(req.body);
        // Authenticate user
        const result = yield authService_1.default.login(validatedData);
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    }
    catch (error) {
        console.error('Login controller error:', error);
        // Handle validation errors
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.issues.map((err) => ({
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
});
exports.login = login;
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
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // In a stateless JWT system, we primarily rely on client-side token removal
        // For enhanced security, you could implement server-side token blacklisting here
        res.status(200).json({
            success: true,
            message: 'Logout successful',
            note: 'Remove the token from client storage'
        });
    }
    catch (error) {
        console.error('Logout controller error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
            code: 'LOGOUT_ERROR'
        });
    }
});
exports.logout = logout;
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
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (error) {
        console.error('Get current user controller error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user information',
            code: 'USER_INFO_ERROR'
        });
    }
});
exports.getCurrentUser = getCurrentUser;
/**
 * Health check endpoint for authentication service
 *
 * @route GET /api/auth/health
 * @param req Express request
 * @param res Express response with service status
 */
const healthCheck = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        success: true,
        message: 'Authentication service is healthy',
        timestamp: new Date().toISOString()
    });
});
exports.healthCheck = healthCheck;
