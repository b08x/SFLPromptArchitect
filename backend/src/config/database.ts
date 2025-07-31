import { Pool } from 'pg';
import config from './env';

const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

export default pool;
