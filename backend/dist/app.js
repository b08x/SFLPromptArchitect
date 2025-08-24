"use strict";
/**
 * @file app.ts
 * @description Express application setup for the SFL-Prompt-Studio backend.
 * This file configures the Express app without starting the server,
 * making it suitable for testing and modular usage.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const routes_1 = __importDefault(require("./api/routes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for development
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || false
        : ['http://localhost:3000', 'http://localhost:5173'], // Common dev ports
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Security-focused session configuration
const sessionSecret = process.env.SESSION_SECRET || crypto_1.default.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  No SESSION_SECRET found in environment variables. Using auto-generated secret (will not persist across restarts).');
}
app.use((0, express_session_1.default)({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent client-side access
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict', // CSRF protection
    },
    name: 'sfl.session', // Custom session name
}));
app.use(express_1.default.json({ limit: '10mb' })); // Reasonable payload limit
app.use(express_1.default.urlencoded({ extended: true }));
// API routes (authentication now handled within routes)
app.use('/api', routes_1.default);
app.get('/', (req, res) => {
    res.send('SFL Prompt Studio Backend is running!');
});
app.use(errorHandler_1.default);
exports.default = app;
