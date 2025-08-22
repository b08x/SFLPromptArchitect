/**
 * @file OpenAIService.ts
 * @description OpenAI AI service implementation.
 * Provides integration with OpenAI's GPT models including GPT-4, GPT-4 Turbo, and GPT-3.5.
 * Handles OpenAI-specific parameter mapping, authentication, and response parsing.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BaseAIService, AIResponse, AIServiceConfig, AIServiceCapabilities } from './BaseAIService';
import { AIRequest, ModelParameters, OpenAIParameters } from '../../types/aiProvider';

/**
 * OpenAI API response interfaces
 */
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: string;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModel[];
}

/**
 * OpenAI service implementation
 */
export class OpenAIService extends BaseAIService {
  private client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(config: AIServiceConfig) {
    const capabilities: AIServiceCapabilities = {
      supportedParameters: [
        'temperature', 
        'maxTokens', 
        'top_p', 
        'presence_penalty', 
        'frequency_penalty',
        'systemMessage',
        'n',
        'stop'
      ],
      maxContextLength: 128000, // GPT-4 context length
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsImages: true
    };

    super('openai', config, capabilities);
    
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      headers: this.getRequestHeaders()
    });
  }

  /**
   * Test connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * List available OpenAI models
   */
  async listModels(): Promise<string[]> {
    try {
      const response: AxiosResponse<OpenAIModelsResponse> = await this.client.get('/models');
      
      // Filter to only include GPT models that are relevant for text generation
      const gptModels = response.data.data
        .filter((model: OpenAIModel) => 
          model.id.includes('gpt') && 
          !model.id.includes('instruct') &&
          !model.id.includes('edit') &&
          !model.id.includes('whisper') &&
          !model.id.includes('tts') &&
          !model.id.includes('dall-e')
        )
        .map((model: OpenAIModel) => model.id)
        .sort();
      
      return gptModels;
    } catch (error) {
      console.error('Failed to list OpenAI models:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate completion using OpenAI API
   */
  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const payload = this.buildRequestPayload(request);
      this.logRequest(payload);
      
      const response: AxiosResponse<OpenAIResponse> = await this.client.post('/chat/completions', payload);
      
      const aiResponse = this.parseResponse(response.data, startTime);
      this.logResponse(aiResponse);
      
      return aiResponse;
    } catch (error) {
      console.error('OpenAI completion failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate streaming completion (placeholder implementation)
   */
  async generateStreamingCompletion(
    request: AIRequest,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    // For now, implement as non-streaming
    // TODO: Implement actual streaming support
    const response = await this.generateCompletion(request);
    onChunk(response.text);
    return response;
  }

  /**
   * Validate OpenAI parameters
   */
  validateParameters(model: string, parameters: ModelParameters): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = parameters as OpenAIParameters;

    // Validate temperature
    if (params.temperature !== undefined) {
      if (params.temperature < 0 || params.temperature > 2) {
        errors.push('temperature must be between 0 and 2');
      }
    }

    // Validate maxTokens
    if (params.maxTokens !== undefined) {
      if (params.maxTokens < 1 || params.maxTokens > 4096) {
        errors.push('maxTokens must be between 1 and 4096');
      }
    }

    // Validate top_p
    if (params.top_p !== undefined) {
      if (params.top_p < 0 || params.top_p > 1) {
        errors.push('top_p must be between 0 and 1');
      }
    }

    // Validate presence_penalty
    if (params.presence_penalty !== undefined) {
      if (params.presence_penalty < -2 || params.presence_penalty > 2) {
        errors.push('presence_penalty must be between -2 and 2');
      }
    }

    // Validate frequency_penalty
    if (params.frequency_penalty !== undefined) {
      if (params.frequency_penalty < -2 || params.frequency_penalty > 2) {
        errors.push('frequency_penalty must be between -2 and 2');
      }
    }

    // Validate n
    if (params.n !== undefined) {
      if (params.n < 1 || params.n > 4) {
        errors.push('n must be between 1 and 4');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalize parameters to OpenAI format
   */
  protected normalizeParameters(parameters: ModelParameters): Record<string, any> {
    const params = parameters as OpenAIParameters;
    const normalized: Record<string, any> = {};

    // Map standard parameters
    if (params.temperature !== undefined) normalized.temperature = params.temperature;
    if (params.maxTokens !== undefined) normalized.max_tokens = params.maxTokens;
    if (params.top_p !== undefined) normalized.top_p = params.top_p;
    if (params.presence_penalty !== undefined) normalized.presence_penalty = params.presence_penalty;
    if (params.frequency_penalty !== undefined) normalized.frequency_penalty = params.frequency_penalty;
    if (params.n !== undefined) normalized.n = params.n;
    if (params.stop !== undefined) normalized.stop = params.stop;

    return this.sanitizeParameters(normalized);
  }

  /**
   * Build OpenAI API request payload
   */
  protected buildRequestPayload(request: AIRequest): Record<string, any> {
    const parameters = this.normalizeParameters(request.parameters);
    const params = request.parameters as OpenAIParameters;
    
    // Build messages array
    const messages: OpenAIMessage[] = [];
    
    // Add system message if provided
    const systemMessage = params.systemMessage || request.systemMessage;
    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage
      });
    }
    
    // Add conversation history if provided
    if (request.conversationHistory) {
      request.conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // Add current prompt
    messages.push({
      role: 'user',
      content: request.prompt
    });
    
    return {
      model: request.model,
      messages,
      ...parameters
    };
  }

  /**
   * Parse OpenAI response to standard format
   */
  protected parseResponse(response: OpenAIResponse, startTime: number): AIResponse {
    const choice = response.choices[0];
    if (!choice) {
      throw new Error('No choices returned from OpenAI API');
    }

    return {
      text: choice.message.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      metadata: {
        id: response.id,
        created: response.created,
        finishReason: choice.finish_reason
      },
      model: response.model,
      processingTime: this.calculateProcessingTime(startTime)
    };
  }

  /**
   * Add OpenAI-specific authentication headers
   */
  protected addAuthHeaders(headers: Record<string, string>): void {
    headers['Authorization'] = `Bearer ${this.config.apiKey}`;
  }
}

/**
 * Factory function for creating OpenAI service instances
 */
export function createOpenAIService(config: AIServiceConfig): OpenAIService {
  return new OpenAIService(config);
}