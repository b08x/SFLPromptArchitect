/**
 * @file app.ts
 * @description Express application setup for the SFL-Prompt-Studio backend.
 * This file configures the Express app without starting the server,
 * making it suitable for testing and modular usage.
 */

import express, { Request, Response } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import errorHandler from './middleware/errorHandler';
import apiRoutes from './api/routes';

// Extend session interface to include custom properties
declare module 'express-session' {
  interface SessionData {
    apiKeys?: {
      [provider: string]: {
        encrypted: string;
        iv: string;
        tag: string;
        timestamp: number;
      };
    };
    baseUrls?: {
      [provider: string]: string;
    };
  }
}

const app = express();

// Security middleware
app.use(helmet({
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
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || false 
    : ['http://localhost:3000', 'http://localhost:5173'], // Common dev ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security-focused session configuration
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  No SESSION_SECRET found in environment variables. Using auto-generated secret (will not persist across restarts).');
}

app.use(session({
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

app.use(express.json({ limit: '10mb' })); // Reasonable payload limit
app.use(express.urlencoded({ extended: true }));

// API routes (authentication now handled within routes)
app.use('/api', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('SFL Prompt Studio Backend is running!');
});

app.use(errorHandler);

export default app;