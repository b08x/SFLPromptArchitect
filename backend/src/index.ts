/**
 * @file index.ts
 * @description This is the main entry point for the SFL-Prompt-Studio backend server.
 * It imports the Express application, creates an HTTP server, and initializes WebSocket support.
 *
 * @requires ./app
 * @requires ./config/logger
 * @requires ./config/env
 * @requires ./services/webSocketService
 */

import { createServer } from 'http';
import app from './app';
import logger from './config/logger';
import config from './config/env';
import webSocketService from './services/webSocketService';

const port = config.port;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
webSocketService.initialize(server);

// Start the server
server.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
  logger.info(`WebSocket server is available at ws://localhost:${port}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  webSocketService.shutdown();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  webSocketService.shutdown();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});