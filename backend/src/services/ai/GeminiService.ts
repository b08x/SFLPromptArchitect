/**
 * @file GeminiService.ts
 * @description Google Gemini AI service implementation.
 * Provides integration with Google's Gemini models including Gemini Pro and Gemini Flash.
 * Handles Gemini-specific parameter mapping, authentication, and response parsing.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BaseAIService, AIResponse, AIServiceConfig, AIServiceCapabilities } from './BaseAIService';
import { AIRequest, ModelParameters, GeminiParameters } from '../../types/aiProvider';

/**
 * Gemini API interfaces
 */
interface GeminiContent {
  parts: Array<{
    text: string;
  }>;
  role?: 'user' | 'model';
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
  index: number;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

interface GeminiUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: GeminiUsage;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    candidateCount?: number;
    stopSequences?: string[];
    responseMimeType?: string;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  systemInstruction?: {
    parts: Array<{
      text: string;
    }>;
    role: 'system';
  };
}

/**
 * Gemini service implementation
 */
export class GeminiService extends BaseAIService {
  private client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(config: AIServiceConfig) {
    const capabilities: AIServiceCapabilities = {
      supportedParameters: [
        'temperature', 
        'maxTokens', 
        'topK', 
        'topP',
        'systemInstruction',
        'safetySettings'
      ],
      maxContextLength: 1048576, // Gemini Pro context length
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsImages: true
    };

    super('google', config, capabilities);
    
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 60000,
      headers: this.getRequestHeaders()
    });
  }

  /**
   * Test connection to Gemini API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple model listing request
      const response = await this.client.get(`/models?key=${this.config.apiKey}`);
      return response.status === 200;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }

  /**
   * List available Gemini models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get(`/models?key=${this.config.apiKey}`);
      
      if (response.data && response.data.models) {
        return response.data.models
          .filter((model: any) => model.name.includes('gemini'))
          .map((model: any) => model.name.replace('models/', ''))
          .sort();
      }
      
      // Return default models if API call fails
      return [
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-pro-vision'
      ];
    } catch (error) {
      console.error('Failed to list Gemini models:', error);
      // Return default models on error
      return [
        'gemini-2.5-flash',
        'gemini-1.5-flash', 
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-pro-vision'
      ];
    }
  }

  /**
   * Generate completion using Gemini API with optional JSON mode
   */
  async generateCompletion(request: AIRequest & { forceJsonMode?: boolean }): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const payload = this.buildRequestPayload(request);
      this.logRequest(payload);
      
      // Log JSON mode status
      if (request.forceJsonMode) {
        console.log('GeminiService: Executing request with JSON mode enabled');
      }
      
      const modelName = this.normalizeModelName(request.model);
      const url = `/models/${modelName}:generateContent?key=${this.config.apiKey}`;
      
      const response: AxiosResponse<GeminiResponse> = await this.client.post(url, payload);
      
      const aiResponse = this.parseResponse(response.data, startTime);
      
      // Enhanced logging for JSON mode responses
      if (request.forceJsonMode) {
        console.log('GeminiService: JSON mode response received, length:', aiResponse.text.length);
      }
      
      this.logResponse(aiResponse);
      
      return aiResponse;
    } catch (error) {
      console.error('Gemini completion failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate streaming completion (placeholder implementation)
   */
  async generateStreamingCompletion(
    request: AIRequest & { forceJsonMode?: boolean },
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    // For now, implement as non-streaming
    // TODO: Implement actual streaming support using streamGenerateContent
    const response = await this.generateCompletion(request);
    onChunk(response.text);
    return response;
  }

  /**
   * Validate Gemini parameters
   */
  validateParameters(model: string, parameters: ModelParameters): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const params = parameters as GeminiParameters;

    // Validate temperature
    if (params.temperature !== undefined) {
      if (params.temperature < 0 || params.temperature > 2) {
        errors.push('temperature must be between 0 and 2');
      }
    }

    // Validate maxTokens
    if (params.maxTokens !== undefined) {
      if (params.maxTokens < 1 || params.maxTokens > 8192) {
        errors.push('maxTokens must be between 1 and 8192');
      }
    }

    // Validate topK
    if (params.topK !== undefined) {
      if (params.topK < 1 || params.topK > 40) {
        errors.push('topK must be between 1 and 40');
      }
    }

    // Validate topP
    if (params.topP !== undefined) {
      if (params.topP < 0 || params.topP > 1) {
        errors.push('topP must be between 0 and 1');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalize parameters to Gemini format with JSON mode support
   */
  protected normalizeParameters(parameters: ModelParameters & { forceJsonMode?: boolean }): Record<string, any> {
    const params = parameters as GeminiParameters & { forceJsonMode?: boolean };
    const normalized: Record<string, any> = {};

    // Map to Gemini generationConfig format
    const generationConfig: Record<string, any> = {};
    
    if (params.temperature !== undefined) generationConfig.temperature = params.temperature;
    if (params.maxTokens !== undefined) generationConfig.maxOutputTokens = params.maxTokens;
    if (params.topK !== undefined) generationConfig.topK = params.topK;
    if (params.topP !== undefined) generationConfig.topP = params.topP;
    
    // Enable JSON mode when requested (for orchestration calls)
    if (params.forceJsonMode) {
      generationConfig.responseMimeType = "application/json";
      console.log("GeminiService: JSON mode enabled for this request");
    }

    if (Object.keys(generationConfig).length > 0) {
      normalized.generationConfig = generationConfig;
    }

    // Handle safety settings
    if (params.safetySettings) {
      normalized.safetySettings = params.safetySettings;
    }

    return this.sanitizeParameters(normalized);
  }

  /**
   * Build Gemini API request payload with optional JSON mode
   */
  protected buildRequestPayload(request: AIRequest & { forceJsonMode?: boolean }): GeminiGenerateContentRequest {
    // Pass through forceJsonMode to parameter normalization
    const extendedParams = {
      ...request.parameters,
      forceJsonMode: request.forceJsonMode
    };
    
    const parameters = this.normalizeParameters(extendedParams);
    const params = request.parameters as GeminiParameters;
    
    // Build contents array
    const contents: GeminiContent[] = [];
    
    // Add conversation history if provided
    if (request.conversationHistory) {
      request.conversationHistory.forEach(msg => {
        contents.push({
          parts: [{ text: msg.content }],
          role: msg.role === 'assistant' ? 'model' : 'user'
        });
      });
    }
    
    // Add current prompt
    contents.push({
      parts: [{ text: request.prompt }],
      role: 'user'
    });

    const payload: GeminiGenerateContentRequest = {
      contents,
      ...parameters
    };

    // Add system instruction if provided
    const systemMessage = params.systemInstruction || request.systemMessage;
    if (systemMessage) {
      payload.systemInstruction = {
        parts: [{ text: systemMessage }],
        role: 'system'
      };
    }

    return payload;
  }

  /**
   * Parse Gemini response to standard format
   */
  protected parseResponse(response: GeminiResponse, startTime: number): AIResponse {
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidates returned from Gemini API');
    }

    const text = candidate.content?.parts?.[0]?.text || '';

    return {
      text,
      usage: response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount,
        completionTokens: response.usageMetadata.candidatesTokenCount,
        totalTokens: response.usageMetadata.totalTokenCount
      } : undefined,
      metadata: {
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
        promptFeedback: response.promptFeedback
      },
      model: 'gemini', // Gemini doesn't return model in response
      processingTime: this.calculateProcessingTime(startTime)
    };
  }

  /**
   * Add Gemini-specific authentication headers
   */
  protected addAuthHeaders(headers: Record<string, string>): void {
    // Gemini uses API key in query params, not headers
    // But we include it here for completeness
    headers['x-goog-api-key'] = this.config.apiKey;
  }

  /**
   * Normalize model name for Gemini API
   */
  private normalizeModelName(model: string): string {
    // Remove 'models/' prefix if present
    if (model.startsWith('models/')) {
      return model.substring(7);
    }
    return model;
  }
}

/**
 * Enhanced Gemini service with JSON mode orchestration support
 */
export class GeminiOrchestrationService extends GeminiService {
  /**
   * Generate completion specifically for orchestration with guaranteed JSON mode
   */
  async generateOrchestrationCompletion(request: AIRequest): Promise<AIResponse> {
    const orchestrationRequest = {
      ...request,
      forceJsonMode: true
    };
    
    console.log('GeminiOrchestrationService: Generating completion with guaranteed JSON mode');
    return this.generateCompletion(orchestrationRequest);
  }
}

/**
 * Factory function for creating Gemini service instances
 */
export function createGeminiService(config: AIServiceConfig): GeminiService {
  return new GeminiService(config);
}

/**
 * Factory function for creating orchestration-enhanced Gemini service instances
 */
export function createGeminiOrchestrationService(config: AIServiceConfig): GeminiOrchestrationService {
  return new GeminiOrchestrationService(config);
}