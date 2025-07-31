import dotenv from 'dotenv';

dotenv.config();

export default {
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
};
