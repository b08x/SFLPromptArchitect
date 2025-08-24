"use strict";
/**
 * @file auth.ts
 * @description Authentication routes with security middleware
 * This file defines all authentication-related HTTP endpoints with proper security measures
 *
 * ROUTES:
 * - POST /register - User registration
 * - POST /login - User login
 * - POST /logout - User logout
 * - GET /me - Get current user
 * - GET /health - Service health check
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = __importDefault(require("../../middleware/authMiddleware"));
const router = (0, express_1.Router)();
// Rate limiting for authentication endpoints
// More restrictive for auth operations to prevent brute force attacks
const authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many authentication attempts',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for successful requests
    skipSuccessfulRequests: true
});
// More lenient rate limiting for general auth endpoints
const generalAuthRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
/**
 * @route POST /api/auth/register
 * @description Register a new user account
 * @access Public
 * @ratelimit 5 attempts per 15 minutes
 *
 * @body {string} email - Valid email address
 * @body {string} password - Strong password meeting requirements
 *
 * @returns {201} Registration successful with JWT token
 * @returns {400} Validation error
 * @returns {409} User already exists
 * @returns {429} Rate limit exceeded
 * @returns {500} Internal server error
 */
router.post('/register', authRateLimit, authController_1.register);
/**
 * @route POST /api/auth/login
 * @description Authenticate user and return JWT token
 * @access Public
 * @ratelimit 5 attempts per 15 minutes
 *
 * @body {string} email - User email address
 * @body {string} password - User password
 *
 * @returns {200} Login successful with JWT token
 * @returns {400} Validation error
 * @returns {401} Invalid credentials
 * @returns {429} Rate limit exceeded
 * @returns {500} Internal server error
 */
router.post('/login', authRateLimit, authController_1.login);
/**
 * @route POST /api/auth/logout
 * @description Logout current user (client-side token removal)
 * @access Private - Requires authentication
 * @ratelimit 20 requests per 15 minutes
 *
 * @header {string} Authorization - Bearer JWT token
 *
 * @returns {200} Logout successful
 * @returns {401} Authentication required
 * @returns {429} Rate limit exceeded
 * @returns {500} Internal server error
 */
router.post('/logout', generalAuthRateLimit, authMiddleware_1.default, authController_1.logout);
/**
 * @route GET /api/auth/me
 * @description Get current authenticated user information
 * @access Private - Requires authentication
 * @ratelimit 20 requests per 15 minutes
 *
 * @header {string} Authorization - Bearer JWT token
 *
 * @returns {200} Current user information
 * @returns {401} Authentication required
 * @returns {429} Rate limit exceeded
 * @returns {500} Internal server error
 */
router.get('/me', generalAuthRateLimit, authMiddleware_1.default, authController_1.getCurrentUser);
/**
 * @route GET /api/auth/health
 * @description Check authentication service health
 * @access Public
 * @ratelimit 20 requests per 15 minutes
 *
 * @returns {200} Service health status
 * @returns {429} Rate limit exceeded
 */
router.get('/health', generalAuthRateLimit, authController_1.healthCheck);
exports.default = router;
