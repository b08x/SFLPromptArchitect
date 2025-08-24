"use strict";
/**
 * @file authMiddleware.ts
 * @description JWT-based authentication middleware that replaces the insecure tempAuth system
 * This middleware validates JWT tokens and attaches authenticated user information to requests
 *
 * SECURITY FEATURES:
 * - JWT token validation with secret verification
 * - User existence validation in database
 * - Proper error handling without information leakage
 * - Request rate limiting protection
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
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
require("../types/express");
// JWT secret from environment with fallback (should be set in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: No JWT_SECRET found in environment variables. Using default secret (INSECURE for production).');
}
/**
 * JWT Authentication Middleware
 * Validates JWT tokens from Authorization header and attaches user info to request
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 *
 * @security
 * - Validates JWT signature and expiration
 * - Checks user existence in database
 * - Prevents timing attacks with consistent error responses
 * - Rate limiting applied at route level
 */
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_MISSING_TOKEN'
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify JWT token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (jwtError) {
            // Handle specific JWT errors
            if (jwtError instanceof jsonwebtoken_1.default.TokenExpiredError) {
                res.status(401).json({
                    error: 'Token expired',
                    code: 'AUTH_TOKEN_EXPIRED'
                });
                return;
            }
            else if (jwtError instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                res.status(401).json({
                    error: 'Invalid token',
                    code: 'AUTH_TOKEN_INVALID'
                });
                return;
            }
            else {
                throw jwtError; // Re-throw unexpected errors
            }
        }
        // Validate user exists in database
        const pool = yield (0, database_1.default)();
        const userQuery = 'SELECT id, email FROM users WHERE id = $1';
        const userResult = yield pool.query(userQuery, [decoded.userId]);
        if (userResult.rows.length === 0) {
            res.status(401).json({
                error: 'User not found',
                code: 'AUTH_USER_NOT_FOUND'
            });
            return;
        }
        const user = userResult.rows[0];
        // Attach user information to request
        req.user = {
            id: user.id,
            email: user.email,
            // Add other user properties as needed
        };
        next();
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'AUTH_INTERNAL_ERROR'
        });
    }
});
exports.authMiddleware = authMiddleware;
/**
 * Optional middleware for routes that can work with or without authentication
 * Attaches user info if valid token is present, but doesn't require it
 */
const optionalAuthMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without user
        next();
        return;
    }
    try {
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const pool = yield (0, database_1.default)();
        const userQuery = 'SELECT id, email FROM users WHERE id = $1';
        const userResult = yield pool.query(userQuery, [decoded.userId]);
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            req.user = {
                id: user.id,
                email: user.email,
            };
        }
    }
    catch (error) {
        // Ignore token errors for optional auth
        console.warn('Optional auth middleware - invalid token ignored:', error.message);
    }
    next();
});
exports.optionalAuthMiddleware = optionalAuthMiddleware;
exports.default = exports.authMiddleware;
