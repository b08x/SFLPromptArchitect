"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
/**
 * @file Loads and exports environment variables for the application.
 * @author Your Name
 */
dotenv_1.default.config();
/**
 * @type {object}
 * @description An object containing the application's environment variables.
 * @property {string} databaseUrl - The connection URL for the PostgreSQL database.
 * @property {string} redisUrl - The connection URL for the Redis server.
 * @property {string} geminiApiKey - The API key for the Gemini service.
 * @property {string} nodeEnv - The current environment (e.g., 'development', 'production').
 * @property {number} port - The port number for the application server.
 */
exports.default = {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    geminiApiKey: process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4000,
};
