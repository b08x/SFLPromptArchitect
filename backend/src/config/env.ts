import dotenv from 'dotenv';

/**
 * @file Loads and exports environment variables for the application.
 * @author Your Name
 */

dotenv.config();

/**
 * @type {object}
 * @description An object containing the application's environment variables.
 * @property {string} databaseUrl - The connection URL for the PostgreSQL database.
 * @property {string} redisUrl - The connection URL for the Redis server.
 * @property {string} geminiApiKey - The API key for the Gemini service.
 * @property {string} nodeEnv - The current environment (e.g., 'development', 'production').
 * @property {number} port - The port number for the application server.
 */
export default {
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
};