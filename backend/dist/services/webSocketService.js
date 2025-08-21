"use strict";
/**
 * @file webSocketService.ts
 * @description WebSocket service for real-time communication with clients.
 * Manages WebSocket connections and broadcasts workflow execution updates.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Service class for managing WebSocket connections and real-time updates
 */
class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map();
    }
    /**
     * Initializes the WebSocket server
     * @param server - HTTP server to attach WebSocket server to
     */
    initialize(server) {
        this.wss = new ws_1.WebSocketServer({
            server,
            path: '/ws',
        });
        this.wss.on('connection', this.handleConnection.bind(this));
        logger_1.default.info('WebSocket server initialized');
    }
    /**
     * Handles new WebSocket connections
     * @param ws - The WebSocket connection
     */
    handleConnection(ws) {
        const clientId = this.generateClientId();
        const client = {
            ws,
            subscriptions: new Set(),
            id: clientId,
        };
        this.clients.set(clientId, client);
        logger_1.default.info(`New WebSocket client connected: ${clientId}`);
        // Send welcome message
        this.sendToClient(clientId, {
            type: 'workflow_progress',
            jobId: 'system',
            status: 'connected',
            timestamp: new Date().toISOString(),
        });
        // Handle incoming messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleClientMessage(clientId, message);
            }
            catch (error) {
                logger_1.default.error(`Failed to parse WebSocket message from ${clientId}:`, error);
            }
        });
        // Handle connection close
        ws.on('close', () => {
            this.clients.delete(clientId);
            logger_1.default.info(`WebSocket client disconnected: ${clientId}`);
        });
        // Handle errors
        ws.on('error', (error) => {
            logger_1.default.error(`WebSocket error for client ${clientId}:`, error);
            this.clients.delete(clientId);
        });
    }
    /**
     * Handles messages from clients
     * @param clientId - The client ID
     * @param message - The message from the client
     */
    handleClientMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        switch (message.type) {
            case 'subscribe':
                if (message.jobId) {
                    client.subscriptions.add(message.jobId);
                    logger_1.default.info(`Client ${clientId} subscribed to job ${message.jobId}`);
                }
                break;
            case 'unsubscribe':
                if (message.jobId) {
                    client.subscriptions.delete(message.jobId);
                    logger_1.default.info(`Client ${clientId} unsubscribed from job ${message.jobId}`);
                }
                break;
            default:
                logger_1.default.warn(`Unknown message type from client ${clientId}:`, message.type);
        }
    }
    /**
     * Sends a message to a specific client
     * @param clientId - The client ID
     * @param message - The message to send
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== ws_1.WebSocket.OPEN) {
            return;
        }
        try {
            client.ws.send(JSON.stringify(message));
        }
        catch (error) {
            logger_1.default.error(`Failed to send message to client ${clientId}:`, error);
            this.clients.delete(clientId);
        }
    }
    /**
     * Broadcasts a message to all clients subscribed to a specific job
     * @param jobId - The job ID
     * @param message - The message to broadcast
     */
    broadcastToJob(jobId, message) {
        const fullMessage = Object.assign(Object.assign({}, message), { jobId, timestamp: new Date().toISOString() });
        let sentCount = 0;
        for (const [clientId, client] of this.clients) {
            if (client.subscriptions.has(jobId)) {
                this.sendToClient(clientId, fullMessage);
                sentCount++;
            }
        }
        logger_1.default.debug(`Broadcasted message to ${sentCount} clients for job ${jobId}`);
    }
    /**
     * Broadcasts a message to all connected clients
     * @param message - The message to broadcast
     */
    broadcastToAll(message) {
        const fullMessage = Object.assign(Object.assign({}, message), { timestamp: new Date().toISOString() });
        let sentCount = 0;
        for (const [clientId] of this.clients) {
            this.sendToClient(clientId, fullMessage);
            sentCount++;
        }
        logger_1.default.debug(`Broadcasted message to ${sentCount} clients`);
    }
    /**
     * Gets the number of connected clients
     * @returns The number of connected clients
     */
    getClientCount() {
        return this.clients.size;
    }
    /**
     * Gets the number of clients subscribed to a specific job
     * @param jobId - The job ID
     * @returns The number of subscribed clients
     */
    getSubscribedClientCount(jobId) {
        let count = 0;
        for (const client of this.clients.values()) {
            if (client.subscriptions.has(jobId)) {
                count++;
            }
        }
        return count;
    }
    /**
     * Generates a unique client ID
     * @returns A unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Shuts down the WebSocket service
     */
    shutdown() {
        if (this.wss) {
            this.wss.close(() => {
                logger_1.default.info('WebSocket server closed');
            });
        }
        for (const [clientId, client] of this.clients) {
            client.ws.close();
        }
        this.clients.clear();
    }
}
exports.default = new WebSocketService();
