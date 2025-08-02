"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const env_1 = __importDefault(require("./env"));
/**
 * @file Manages the PostgreSQL database connection pool.
 * @author Your Name
 */
/**
 * @type {Pool}
 * @description A PostgreSQL connection pool instance.
 * It automatically handles acquiring and releasing client connections.
 * @see {@link https://node-postgres.com/features/pooling|node-postgres pooling}
 */
const pool = new pg_1.Pool({
    connectionString: env_1.default.databaseUrl,
});
/**
 * @event connect
 * @description Event listener for when a client has connected to the database.
 * Logs a confirmation message to the console.
 */
pool.on('connect', () => {
    console.log('Connected to the database');
});
exports.default = pool;
