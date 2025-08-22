/**
 * @file BaseAIService.ts
 * @description Abstract base class for AI service implementations.
 * Defines the common interface and shared functionality for all AI providers.
 * This architecture allows for dynamic provider switching while maintaining
 * consistent behavior across different AI services.
 *
 * @requires ../../types/aiProvider
 */

import { AIProvider, ModelParameters, AIRequest } from '../../types/aiProvider';

/**
 * Standard AI response interface
 */
export interface AIResponse {
  /** The generated text response */
  text: string;
  /** Token usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Additional metadata from the provider */
  metadata?: Record<string, any>;
  /** The model used for generation */
  model: string;
  /** Processing time in milliseconds */
  processingTime?: number;
}

/**
 * AI service capabilities
 */
export interface AIServiceCapabilities {
  /** Supported parameter types */
  supportedParameters: string[];
  /** Maximum context length */
  maxContextLength: number;
  /** Whether the service supports streaming */
  supportsStreaming: boolean;
  /** Whether the service supports function calling */
  supportsFunctionCalling: boolean;
  /** Whether the service supports image inputs */
  supportsImages: boolean;
}

/**
 * Configuration options for AI service initialization
 */
export interface AIServiceConfig {
  /** API key for the service */
  apiKey: string;
  /** Optional base URL override */
  baseUrl?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Additional headers */
  headers?: Record<string, string>;
}

/**
 * Abstract base class for AI service implementations.
 * All AI provider services must extend this class and implement the required methods.
 */
export abstract class BaseAIService {
  protected readonly provider: AIProvider;
  protected readonly config: AIServiceConfig;
  protected readonly capabilities: AIServiceCapabilities;

  /**
   * Constructor for base AI service
   * @param provider - The AI provider identifier
   * @param config - Service configuration
   * @param capabilities - Service capabilities
   */
  constructor(provider: AIProvider, config: AIServiceConfig, capabilities: AIServiceCapabilities) {
    this.provider = provider;
    this.config = config;
    this.capabilities = capabilities;
    
    this.validateConfig();
  }

  /**
   * Get the provider identifier
   */
  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * Get service capabilities
   */
  getCapabilities(): AIServiceCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Test the service connection and API key validity
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * List available models for this provider
   */
  abstract listModels(): Promise<string[]>;

  /**
   * Generate text completion using the AI service
   * @param request - The AI request configuration
   */
  abstract generateCompletion(request: AIRequest): Promise<AIResponse>;

  /**
   * Generate streaming text completion (if supported)
   * @param request - The AI request configuration
   * @param onChunk - Callback for each streaming chunk
   */
  abstract generateStreamingCompletion(
    request: AIRequest,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse>;

  /**
   * Validate model parameters against provider constraints
   * @param model - The model identifier
   * @param parameters - The parameters to validate
   */
  abstract validateParameters(model: string, parameters: ModelParameters): {
    valid: boolean;
    errors: string[];
  };

  /**
   * Normalize parameters from the frontend format to provider-specific format
   * @param parameters - Frontend parameters
   */
  protected abstract normalizeParameters(parameters: ModelParameters): Record<string, any>;

  /**
   * Build the request payload for the provider's API
   * @param request - The standardized AI request
   */
  protected abstract buildRequestPayload(request: AIRequest): Record<string, any>;

  /**
   * Parse the provider's response into the standard format
   * @param response - Raw provider response
   * @param startTime - Request start time for calculating processing time
   */
  protected abstract parseResponse(response: any, startTime: number): AIResponse;

  /**
   * Handle provider-specific errors and convert them to standard format
   * @param error - The error from the provider
   */
  protected handleError(error: any): Error {
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText || 'Unknown error';
      
      switch (status) {
        case 401:
          return new Error(`Authentication failed: ${message}`);
        case 403:
          return new Error(`Access forbidden: ${message}`);
        case 404:
          return new Error(`Resource not found: ${message}`);
        case 429:
          return new Error(`Rate limit exceeded: ${message}`);
        case 500:
          return new Error(`Server error: ${message}`);
        default:
          return new Error(`API error (${status}): ${message}`);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error: Unable to reach the AI service');
    } else {
      // Other error
      return new Error(error.message || 'Unknown error occurred');
    }
  }

  /**
   * Validate the service configuration
   */
  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.provider} service`);
    }
    
    if (this.config.timeout && this.config.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }
  }

  /**
   * Get request headers with authentication
   */
  protected getRequestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SFL-Prompt-Studio/1.0',
      ...this.config.headers
    };
    
    // Add provider-specific authentication headers
    this.addAuthHeaders(headers);
    
    return headers;
  }

  /**
   * Add provider-specific authentication headers
   * @param headers - Headers object to modify
   */
  protected abstract addAuthHeaders(headers: Record<string, string>): void;

  /**
   * Calculate processing time
   * @param startTime - Request start time
   */
  protected calculateProcessingTime(startTime: number): number {
    return Date.now() - startTime;
  }

  /**
   * Sanitize parameters to remove undefined/null values
   * @param params - Parameters to sanitize
   */
  protected sanitizeParameters(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  /**
   * Log request for debugging (with sensitive data removed)
   * @param request - The request to log
   */
  protected logRequest(request: any): void {
    if (process.env.NODE_ENV === 'development') {
      const safeRequest = { ...request };
      // Remove sensitive data
      if (safeRequest.headers?.Authorization) {
        safeRequest.headers.Authorization = '[REDACTED]';
      }
      if (safeRequest.headers?.['x-api-key']) {
        safeRequest.headers['x-api-key'] = '[REDACTED]';
      }
      
      console.log(`[${this.provider.toUpperCase()}] Request:`, JSON.stringify(safeRequest, null, 2));
    }
  }

  /**
   * Log response for debugging
   * @param response - The response to log
   */
  protected logResponse(response: AIResponse): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.provider.toUpperCase()}] Response:`, {
        textLength: response.text.length,
        usage: response.usage,
        processingTime: response.processingTime,
        model: response.model
      });
    }
  }
}

/**
 * Factory function type for creating AI service instances
 */
export type AIServiceFactory = (config: AIServiceConfig) => BaseAIService;