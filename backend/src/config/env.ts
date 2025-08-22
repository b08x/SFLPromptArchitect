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

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * @interface Config
 * @description Type definition for the application configuration object.
 */
interface Config {
  /** The connection URL for the PostgreSQL database */
  databaseUrl: string | undefined;
  /** The connection URL for the Redis server */
  redisUrl: string | undefined;
  /** The API key for accessing Google's Gemini service */
  geminiApiKey: string | undefined;
  /** The API key for accessing OpenAI's service */
  openaiApiKey: string | undefined;
  /** The API key for accessing OpenRouter's service */
  openrouterApiKey: string | undefined;
  /** The API key for accessing Anthropic's Claude service */
  anthropicApiKey: string | undefined;
  /** The default AI provider to use */
  defaultAiProvider: string;
  /** The fallback AI provider if default fails */
  fallbackAiProvider: string;
  /** OpenAI default model */
  openaiDefaultModel: string;
  /** Google default model */
  googleDefaultModel: string;
  /** OpenRouter default model */
  openrouterDefaultModel: string;
  /** OpenRouter base URL */
  openrouterBaseUrl: string;
  /** Anthropic default model */
  anthropicDefaultModel: string;
  /** Whether grounding is enabled */
  enableGrounding: boolean;
  /** The current environment (development, production, test) */
  nodeEnv: string;
  /** The port number for the application server */
  port: string | number;
}

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
export default {
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || 'google',
  fallbackAiProvider: process.env.FALLBACK_AI_PROVIDER || 'openai',
  openaiDefaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
  googleDefaultModel: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.5-flash',
  openrouterDefaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4',
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  anthropicDefaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet',
  enableGrounding: process.env.ENABLE_GROUNDING === 'true',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
};