/**
 * @file webSocketService.ts
 * @description WebSocket service for real-time communication with clients.
 * Manages WebSocket connections and broadcasts workflow execution updates.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import logger from '../config/logger';

/**
 * @interface WebSocketMessage
 * @description Structure of messages sent over WebSocket
 */
export interface WebSocketMessage {
  type: 'workflow_progress' | 'task_status' | 'workflow_complete' | 'workflow_failed';
  jobId: string;
  workflowId?: string;
  taskId?: string;
  taskName?: string;
  status?: string;
  result?: any;
  error?: string;
  progress?: number;
  timestamp?: string;
}

/**
 * @interface ClientConnection
 * @description Represents a connected WebSocket client
 */
interface ClientConnection {
  ws: WebSocket;
  subscriptions: Set<string>; // Set of jobIds this client is subscribed to
  id: string;
}

/**
 * Service class for managing WebSocket connections and real-time updates
 */
class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();

  /**
   * Initializes the WebSocket server
   * @param server - HTTP server to attach WebSocket server to
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    logger.info('WebSocket server initialized');
  }

  /**
   * Handles new WebSocket connections
   * @param ws - The WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = this.generateClientId();
    const client: ClientConnection = {
      ws,
      subscriptions: new Set(),
      id: clientId,
    };

    this.clients.set(clientId, client);
    logger.info(`New WebSocket client connected: ${clientId}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'workflow_progress',
      jobId: 'system',
      status: 'connected',
      timestamp: new Date().toISOString(),
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (error) {
        logger.error(`Failed to parse WebSocket message from ${clientId}:`, error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      this.clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.clients.delete(clientId);
    });
  }

  /**
   * Handles messages from clients
   * @param clientId - The client ID
   * @param message - The message from the client
   */
  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        if (message.jobId) {
          client.subscriptions.add(message.jobId);
          logger.info(`Client ${clientId} subscribed to job ${message.jobId}`);
        }
        break;
      case 'unsubscribe':
        if (message.jobId) {
          client.subscriptions.delete(message.jobId);
          logger.info(`Client ${clientId} unsubscribed from job ${message.jobId}`);
        }
        break;
      default:
        logger.warn(`Unknown message type from client ${clientId}:`, message.type);
    }
  }

  /**
   * Sends a message to a specific client
   * @param clientId - The client ID
   * @param message - The message to send
   */
  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error(`Failed to send message to client ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  /**
   * Broadcasts a message to all clients subscribed to a specific job
   * @param jobId - The job ID
   * @param message - The message to broadcast
   */
  broadcastToJob(jobId: string, message: Omit<WebSocketMessage, 'jobId'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      jobId,
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.has(jobId)) {
        this.sendToClient(clientId, fullMessage);
        sentCount++;
      }
    }

    logger.debug(`Broadcasted message to ${sentCount} clients for job ${jobId}`);
  }

  /**
   * Broadcasts a message to all connected clients
   * @param message - The message to broadcast
   */
  broadcastToAll(message: WebSocketMessage): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    for (const [clientId] of this.clients) {
      this.sendToClient(clientId, fullMessage);
      sentCount++;
    }

    logger.debug(`Broadcasted message to ${sentCount} clients`);
  }

  /**
   * Gets the number of connected clients
   * @returns The number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Gets the number of clients subscribed to a specific job
   * @param jobId - The job ID
   * @returns The number of subscribed clients
   */
  getSubscribedClientCount(jobId: string): number {
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
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shuts down the WebSocket service
   */
  shutdown(): void {
    if (this.wss) {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
      });
    }

    for (const [clientId, client] of this.clients) {
      client.ws.close();
    }
    this.clients.clear();
  }
}

export default new WebSocketService();