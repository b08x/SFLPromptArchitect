"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./config/logger"));
const env_1 = __importDefault(require("./config/env"));
const webSocketService_1 = __importDefault(require("./services/webSocketService"));
const port = env_1.default.port;
// Create HTTP server
const server = (0, http_1.createServer)(app_1.default);
// Initialize WebSocket service
webSocketService_1.default.initialize(server);
// Start the server
server.listen(port, () => {
    logger_1.default.info(`Server is running on http://localhost:${port}`);
    logger_1.default.info(`WebSocket server is available at ws://localhost:${port}/ws`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    webSocketService_1.default.shutdown();
    server.close(() => {
        logger_1.default.info('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    webSocketService_1.default.shutdown();
    server.close(() => {
        logger_1.default.info('Server closed');
        process.exit(0);
    });
});
