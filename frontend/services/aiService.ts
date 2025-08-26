/**
 * @file aiService.ts
 * @description Enhanced multi-provider AI service with streaming support, provider-specific parameters,
 * and robust error handling. All API keys are managed securely server-side through session storage.
 * @version 2.0.0
 * @since 0.6.0
 */

import authService from './authService';
import { generateAIResponse, AIProvider, ModelInfo } from './providerService';
import { getProviderConfiguration, ProviderConfig, validateParameters } from './providerService';

/**
 * Configuration options for AI generation requests
 */
export interface AIGenerationOptions {
  /** Temperature for creativity control */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Top-k sampling parameter */
  topK?: number;
  /** System message/instruction */
  systemMessage?: string;
  /** Provider-specific parameters */
  parameters?: Record<string, unknown>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable/disable response streaming */
  stream?: boolean;
}

/**
 * Result of AI generation request
 */
export interface AIGenerationResult {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: {
    provider: AIProvider;
    model: string;
    tokensUsed?: number;
    cost?: number;
    latency?: number;
    cached?: boolean;
  };
}

/**
 * Streaming chunk data from AI generation
 */
export interface StreamChunk {
  content: string;
  finished: boolean;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    finishReason?: string;
  };
}

/**
 * Callback function for streaming responses
 */
export type StreamCallback = (chunk: StreamChunk) => void;

/**
 * Configuration for streaming requests
 */
export interface StreamingConfig {
  onChunk: StreamCallback;
  onError?: (error: Error) => void;
  onComplete?: (result: AIGenerationResult) => void;
  signal?: AbortSignal;
}

/**
 * Error class for AI service operations
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public provider?: AIProvider,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * Request cancellation controller
 */
export class RequestController {
  private controller = new AbortController();

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  cancel(reason?: string): void {
    this.controller.abort(reason);
  }

  get cancelled(): boolean {
    return this.controller.signal.aborted;
  }
}

/**
 * Enhanced AI service client with streaming support
 */
export class EnhancedAIService {
  private static instance: EnhancedAIService;
  private activeRequests = new Map<string, RequestController>();

  private constructor() {}

  static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  /**
   * Generate AI response with comprehensive parameter support
   */
  async generateResponse(
    provider: AIProvider,
    model: string,
    prompt: string,
    options: AIGenerationOptions = {}
  ): Promise<AIGenerationResult> {
    const requestId = this.generateRequestId();
    const controller = new RequestController();
    this.activeRequests.set(requestId, controller);

    try {
      // Validate and prepare parameters
      const parameters = await this.prepareParameters(provider, model, options);
      
      // Make the request
      const startTime = Date.now();
      const result = await this.makeRequest({
        provider,
        model,
        prompt,
        parameters,
        systemMessage: options.systemMessage,
        timeout: options.timeout,
        signal: controller.signal
      });

      const latency = Date.now() - startTime;
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          provider,
          model,
          latency
        }
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError('Request was cancelled', provider, 499, error);
      }
      throw this.handleError(error, provider);
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Stream AI response with real-time updates
   */
  async streamResponse(
    provider: AIProvider,
    model: string,
    prompt: string,
    options: AIGenerationOptions,
    streamConfig: StreamingConfig
  ): Promise<string> {
    const requestId = this.generateRequestId();
    const controller = streamConfig.signal ? null : new RequestController();
    const signal = streamConfig.signal || controller?.signal;
    
    if (controller) {
      this.activeRequests.set(requestId, controller);
    }

    try {
      // Prepare parameters
      const parameters = await this.prepareParameters(provider, model, options);
      
      // Use Server-Sent Events for streaming
      return await this.streamWithSSE({
        provider,
        model,
        prompt,
        parameters,
        systemMessage: options.systemMessage,
        signal
      }, streamConfig);
    } catch (error) {
      if (streamConfig.onError) {
        streamConfig.onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw this.handleError(error, provider);
    } finally {
      if (controller) {
        this.activeRequests.delete(requestId);
      }
    }
  }

  /**
   * Cancel a specific request or all active requests
   */
  cancelRequest(requestId?: string): void {
    if (requestId) {
      const controller = this.activeRequests.get(requestId);
      if (controller) {
        controller.cancel('Request cancelled by user');
      }
    } else {
      // Cancel all active requests
      this.activeRequests.forEach(controller => {
        controller.cancel('All requests cancelled');
      });
      this.activeRequests.clear();
    }
  }

  /**
   * Get information about active requests
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Prepare and validate parameters for a specific provider/model
   */
  private async prepareParameters(
    provider: AIProvider,
    model: string,
    options: AIGenerationOptions
  ): Promise<Record<string, unknown>> {
    try {
      // Get provider configuration
      const config = await getProviderConfiguration(provider);
      const modelInfo = config.models.find(m => m.id === model);
      
      if (!modelInfo) {
        throw new AIServiceError(`Model ${model} not found for provider ${provider}`, provider);
      }

      // Build parameters based on model capabilities
      const parameters: Record<string, unknown> = {};
      
      // Standard parameters
      if (options.temperature !== undefined && modelInfo.supportedParameters.includes('temperature')) {
        parameters.temperature = options.temperature;
      }
      if (options.maxTokens !== undefined && modelInfo.supportedParameters.includes('maxTokens')) {
        parameters.maxTokens = options.maxTokens;
      }
      if (options.topP !== undefined) {
        if (modelInfo.supportedParameters.includes('top_p')) {
          parameters.top_p = options.topP;
        } else if (modelInfo.supportedParameters.includes('topP')) {
          parameters.topP = options.topP;
        }
      }
      if (options.topK !== undefined) {
        if (modelInfo.supportedParameters.includes('top_k')) {
          parameters.top_k = options.topK;
        } else if (modelInfo.supportedParameters.includes('topK')) {
          parameters.topK = options.topK;
        }
      }

      // Provider-specific parameters
      if (options.parameters) {
        Object.entries(options.parameters).forEach(([key, value]) => {
          if (modelInfo.supportedParameters.includes(key)) {
            parameters[key] = value;
          }
        });
      }

      // Validate parameters against constraints
      const validation = validateParameters(provider, model, parameters);
      if (!validation.valid) {
        throw new AIServiceError(
          `Parameter validation failed: ${validation.errors.join(', ')}`,
          provider
        );
      }

      return parameters;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        `Failed to prepare parameters: ${error instanceof Error ? error.message : String(error)}`,
        provider
      );
    }
  }

  /**
   * Make HTTP request to backend API
   */
  private async makeRequest(config: {
    provider: AIProvider;
    model: string;
    prompt: string;
    parameters: Record<string, unknown>;
    systemMessage?: string;
    timeout?: number;
    signal?: AbortSignal;
  }): Promise<AIGenerationResult> {
    const response = await authService.authenticatedFetch('/api/proxy/generate', {
      method: 'POST',
      body: JSON.stringify({
        provider: config.provider,
        model: config.model,
        prompt: config.prompt,
        parameters: config.parameters,
        systemMessage: config.systemMessage
      }),
      signal: config.signal,
      ...(config.timeout && {
        timeout: config.timeout
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new AIServiceError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        config.provider,
        response.status
      );
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new AIServiceError(data.error || 'Unknown error', config.provider);
    }

    return {
      success: true,
      response: data.data.response,
      metadata: data.data.metadata
    };
  }

  /**
   * Stream response using Server-Sent Events
   */
  private async streamWithSSE(
    config: {
      provider: AIProvider;
      model: string;
      prompt: string;
      parameters: Record<string, unknown>;
      systemMessage?: string;
      signal?: AbortSignal;
    },
    streamConfig: StreamingConfig
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let fullResponse = '';
      let eventSource: EventSource | null = null;

      try {
        // For now, we'll simulate streaming by making the regular request
        // and then streaming the response in chunks
        // TODO: Implement actual SSE endpoint on backend
        this.makeRequest(config)
          .then(result => {
            if (!result.success || !result.response) {
              throw new AIServiceError('No response received', config.provider);
            }

            // Simulate streaming by sending chunks
            const response = result.response;
            const chunkSize = Math.max(1, Math.floor(response.length / 20)); // ~20 chunks
            let index = 0;

            const streamChunk = () => {
              if (config.signal?.aborted) {
                reject(new AIServiceError('Request cancelled', config.provider, 499));
                return;
              }

              const end = Math.min(index + chunkSize, response.length);
              const chunk = response.slice(index, end);
              const finished = end >= response.length;

              fullResponse += chunk;

              streamConfig.onChunk({
                content: chunk,
                finished,
                metadata: finished ? result.metadata : undefined
              });

              if (finished) {
                if (streamConfig.onComplete) {
                  streamConfig.onComplete(result);
                }
                resolve(fullResponse);
              } else {
                index = end;
                // Add small delay to simulate streaming
                setTimeout(streamChunk, 50);
              }
            };

            // Start streaming
            streamChunk();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }

      // Handle abort signal
      if (config.signal) {
        config.signal.addEventListener('abort', () => {
          if (eventSource) {
            eventSource.close();
          }
          reject(new AIServiceError('Request cancelled', config.provider, 499));
        });
      }
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ai-req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Handle and standardize errors
   */
  private handleError(error: unknown, provider?: AIProvider): AIServiceError {
    if (error instanceof AIServiceError) {
      return error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new AIServiceError('Request was cancelled', provider, 499, error);
      }
      if (error.message.includes('fetch')) {
        return new AIServiceError('Network error - check your connection', provider, 0, error);
      }
      return new AIServiceError(error.message, provider, undefined, error);
    }
    
    return new AIServiceError(String(error), provider);
  }
}

// Export singleton instance
export const aiService = EnhancedAIService.getInstance();

// Legacy compatibility functions

/**
 * @deprecated Use aiService.generateResponse() instead
 */
export async function generateContent(
  provider: AIProvider,
  model: string,
  prompt: string,
  parameters?: Record<string, unknown>,
  systemMessage?: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  console.warn('generateContent() is deprecated. Use aiService.generateResponse() instead.');
  return generateAIResponse(provider, model, prompt, parameters, systemMessage);
}

/**
 * @deprecated This function has been replaced by secure backend validation
 */
export async function validateApiKey(): Promise<never> {
  throw new Error(
    'Direct API key validation is no longer supported for security reasons. ' +
    'Use providerService.saveProviderApiKey() instead.'
  );
}

/**
 * @deprecated This function has been replaced by secure backend model listing
 */
export async function listModels(): Promise<never> {
  throw new Error(
    'Direct model listing is no longer supported for security reasons. ' +
    'Use providerService.getProviderConfiguration() instead.'
  );
}