import { Pool } from 'pg';
import config from './env';

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
const pool: Pool = new Pool({
  connectionString: config.databaseUrl,
});

/**
 * @event connect
 * @description Event listener for when a client has connected to the database.
 * Logs a confirmation message to the console.
 */
pool.on('connect', () => {
  console.log('Connected to the database');
});

export default pool;