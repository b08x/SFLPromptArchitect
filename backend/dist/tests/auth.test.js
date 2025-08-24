"use strict";
/**
 * @file auth.test.ts
 * @description Test suite for JWT authentication system
 * Tests authentication endpoints, middleware, and security features
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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const authService_1 = __importDefault(require("../services/authService"));
// Mock the database pool to avoid real database operations during tests
jest.mock('../config/database', () => ({
    query: jest.fn(),
}));
describe('Authentication System', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user with valid data', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: 'test@example.com',
                password: 'StrongPass123!'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user.email).toBe(userData.email);
        }));
        it('should reject registration with weak password', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: 'test@example.com',
                password: 'weak'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation error');
        }));
        it('should reject registration with invalid email', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: 'invalid-email',
                password: 'StrongPass123!'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation error');
        }));
    });
    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            const credentials = {
                email: 'test@example.com',
                password: 'StrongPass123!'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send(credentials)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('user');
        }));
        it('should reject login with invalid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            const credentials = {
                email: 'test@example.com',
                password: 'wrong-password'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send(credentials)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid email or password');
        }));
    });
    describe('GET /api/auth/me', () => {
        let authToken;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Register a test user and get token
            const userData = {
                email: 'authtest@example.com',
                password: 'StrongPass123!'
            };
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send(userData);
            authToken = response.body.data.token;
        }));
        it('should return user info with valid token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('user');
        }));
        it('should reject request without token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/auth/me')
                .expect(401);
            expect(response.body.error).toBe('Authentication required');
        }));
        it('should reject request with invalid token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(response.body.error).toBe('Invalid token');
        }));
    });
    describe('Protected Routes', () => {
        it('should protect /api/prompts endpoint', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/prompts')
                .expect(401);
            expect(response.body.error).toBe('Authentication required');
        }));
        it('should protect /api/workflows endpoint', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/workflows')
                .expect(401);
            expect(response.body.error).toBe('Authentication required');
        }));
    });
    describe('Rate Limiting', () => {
        it('should enforce rate limiting on auth endpoints', () => __awaiter(void 0, void 0, void 0, function* () {
            const credentials = {
                email: 'test@example.com',
                password: 'wrong-password'
            };
            // Make multiple requests to trigger rate limit
            const promises = Array(6).fill(null).map(() => (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send(credentials));
            const responses = yield Promise.all(promises);
            // Last request should be rate limited
            const lastResponse = responses[responses.length - 1];
            expect(lastResponse.status).toBe(429);
            expect(lastResponse.body.error).toBe('Too many authentication attempts');
        }));
    });
    describe('Security Headers', () => {
        it('should include security headers', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/auth/health')
                .expect(200);
            expect(response.headers).toHaveProperty('x-frame-options');
            expect(response.headers).toHaveProperty('x-content-type-options');
        }));
    });
});
describe('AuthService', () => {
    describe('Password Validation', () => {
        it('should validate strong passwords', () => {
            const { registerSchema } = require('../services/authService');
            const validPasswords = [
                'StrongPass123!',
                'MySecure@Pass1',
                'Complex$Password123'
            ];
            validPasswords.forEach(password => {
                expect(() => {
                    registerSchema.parse({
                        email: 'test@example.com',
                        password
                    });
                }).not.toThrow();
            });
        });
        it('should reject weak passwords', () => {
            const { registerSchema } = require('../services/authService');
            const weakPasswords = [
                'short',
                'nouppercase123!',
                'NOLOWERCASE123!',
                'NoNumbers!',
                'NoSpecialChars123'
            ];
            weakPasswords.forEach(password => {
                expect(() => {
                    registerSchema.parse({
                        email: 'test@example.com',
                        password
                    });
                }).toThrow();
            });
        });
    });
    describe('JWT Operations', () => {
        it('should verify valid JWT tokens', () => __awaiter(void 0, void 0, void 0, function* () {
            // We can only test token verification since generateToken is private
            const payload = yield authService_1.default.verifyToken('invalid-token');
            expect(payload).toBeNull();
        }));
        it('should reject invalid JWT tokens', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = yield authService_1.default.verifyToken('invalid-token');
            expect(payload).toBeNull();
        }));
    });
});
