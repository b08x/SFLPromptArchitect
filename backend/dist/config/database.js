"use strict";
/**
 * @file database.ts
 * @description Manages the PostgreSQL database connection pool for the application.
 * Provides a configured pool instance that handles connection lifecycle management,
 * connection reuse, and automatic cleanup. This is the primary interface for all
 * database operations throughout the backend.
 *
 * @requires pg
 * @requires ./env
 * @since 0.5.1
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const env_1 = __importDefault(require("./env"));
/**
 * PostgreSQL connection pool instance.
 * Automatically manages database connections, handles connection pooling,
 * and provides efficient connection reuse across the application.
 *
 * The pool is configured using the database URL from environment configuration
 * and will automatically handle connection acquisition, release, and cleanup.
 *
 * @type {Pool}
 * @see {@link https://node-postgres.com/features/pooling|node-postgres pooling}
 *
 * @example
 * ```typescript
 * import pool from './config/database';
 *
 * // Execute a query
 * const result = await pool.query('SELECT * FROM prompts WHERE id = $1', [promptId]);
 *
 * // The connection is automatically returned to the pool
 * ```
 *
 * @since 0.5.1
 */
const pool = new pg_1.Pool({
    connectionString: env_1.default.databaseUrl,
});
/**
 * Connection event handler.
 * Logs a confirmation message when a client successfully connects to the database.
 * This is useful for debugging connection issues and monitoring database connectivity.
 *
 * @event Pool#connect
 * @since 0.5.1
 */
pool.on('connect', () => {
    console.log('Connected to the database');
});
/**
 * @exports {Pool} pool
 * @description The configured PostgreSQL connection pool instance.
 * This is the primary database interface used throughout the application
 * for executing queries and managing database connections.
 *
 * @since 0.5.1
 */
exports.default = pool;
