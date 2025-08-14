"use strict";
/**
 * @file env.ts
 * @description Environment configuration module that loads and exports environment variables
 * for the application. Uses dotenv to load variables from .env files and provides
 * a centralized configuration object with sensible defaults.
 *
 * This module should be imported by other configuration modules that need access
 * to environment-specific settings like database URLs, API keys, and runtime settings.
 *
 * @requires dotenv
 * @since 0.5.1
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
/**
 * Application configuration object containing all environment variables.
 * Provides centralized access to environment-specific settings with fallback defaults
 * where appropriate. Some values may be undefined if not set in the environment.
 *
 * @type {Config}
 *
 * @example
 * ```typescript
 * import config from './config/env';
 *
 * console.log(`Starting server on port ${config.port}`);
 * console.log(`Environment: ${config.nodeEnv}`);
 *
 * if (!config.databaseUrl) {
 *   throw new Error('DATABASE_URL environment variable is required');
 * }
 * ```
 *
 * @since 0.5.1
 */
exports.default = {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    geminiApiKey: process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4000,
};
