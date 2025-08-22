/**
 * @file aiProvider.ts
 * @description Enhanced type definitions for AI provider management and parameter configuration
 * Provides comprehensive type safety for dynamic provider switching and parameter management
 */

export type AIProvider = 'google' | 'openai' | 'openrouter' | 'anthropic';

/**
 * Base parameters that all AI providers support
 */
export interface BaseModelParameters {
  /** Controls randomness in generation (0.0 to 2.0) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
}

/**
 * Google Gemini specific parameters
 */
export interface GeminiParameters extends BaseModelParameters {
  /** Top-K sampling parameter (1 to 40) */
  topK?: number;
  /** Top-P/nucleus sampling parameter (0.0 to 1.0) */
  topP?: number;
  /** System instruction for the model */
  systemInstruction?: string;
  /** Safety settings for content filtering */
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

/**
 * OpenAI specific parameters
 */
export interface OpenAIParameters extends BaseModelParameters {
  /** Top-P/nucleus sampling parameter (0.0 to 1.0) */
  top_p?: number;
  /** Number between -2.0 and 2.0. Positive values penalize new tokens */
  presence_penalty?: number;
  /** Number between -2.0 and 2.0. Positive values penalize repeated tokens */
  frequency_penalty?: number;
  /** System message for chat models */
  systemMessage?: string;
  /** Number of completions to generate */
  n?: number;
  /** Sequences where the API will stop generating */
  stop?: string | string[];
}

/**
 * Anthropic Claude specific parameters
 */
export interface AnthropicParameters extends BaseModelParameters {
  /** Top-P/nucleus sampling parameter (0.0 to 1.0) */
  top_p?: number;
  /** Top-K sampling parameter (0 to 200) */
  top_k?: number;
  /** System prompt for Claude */
  system?: string;
  /** Stop sequences */
  stop_sequences?: string[];
}

/**
 * OpenRouter parameters (supports various provider-specific params)
 */
export interface OpenRouterParameters extends BaseModelParameters {
  /** Top-P/nucleus sampling parameter (0.0 to 1.0) */
  top_p?: number;
  /** Top-K sampling parameter */
  top_k?: number;
  /** Presence penalty */
  presence_penalty?: number;
  /** Frequency penalty */
  frequency_penalty?: number;
  /** Repetition penalty */
  repetition_penalty?: number;
  /** Min P sampling parameter */
  min_p?: number;
  /** System message */
  system?: string;
}

/**
 * Union type for all provider-specific parameters
 */
export type ModelParameters = 
  | GeminiParameters 
  | OpenAIParameters 
  | AnthropicParameters 
  | OpenRouterParameters;

/**
 * Parameter constraints and validation rules for each provider
 */
export interface ParameterConstraints {
  temperature?: { min: number; max: number; step: number; default: number };
  maxTokens?: { min: number; max: number; step: number; default: number };
  topK?: { min: number; max: number; step: number; default: number };
  topP?: { min: number; max: number; step: number; default: number };
  top_p?: { min: number; max: number; step: number; default: number };
  top_k?: { min: number; max: number; step: number; default: number };
  presence_penalty?: { min: number; max: number; step: number; default: number };
  frequency_penalty?: { min: number; max: number; step: number; default: number };
  repetition_penalty?: { min: number; max: number; step: number; default: number };
  min_p?: { min: number; max: number; step: number; default: number };
  n?: { min: number; max: number; step: number; default: number };
}

/**
 * Model information including its capabilities and supported parameters
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  description?: string;
  contextLength: number;
  supportedParameters: string[];
  constraints: ParameterConstraints;
  pricing?: {
    input: number; // per 1K tokens
    output: number; // per 1K tokens
  };
}

/**
 * Provider configuration including available models and default parameters
 */
export interface ProviderConfig {
  provider: AIProvider;
  name: string;
  description: string;
  apiKeyRequired: boolean;
  baseUrl?: string;
  models: ModelInfo[];
  defaultParameters: ModelParameters;
  supportedFeatures: string[];
}

/**
 * Active provider configuration for runtime use
 */
export interface ActiveProviderConfig {
  provider: AIProvider;
  model: string;
  parameters: ModelParameters;
  apiKey: string;
  baseUrl?: string;
}

/**
 * Provider status information
 */
export interface ProviderStatus {
  provider: AIProvider;
  isAvailable: boolean;
  hasApiKey: boolean;
  isValid: boolean;
  error?: string;
  lastChecked: Date;
}

/**
 * Parameter preset for quick configuration
 */
export interface ParameterPreset {
  name: string;
  description: string;
  provider: AIProvider;
  model?: string; // If model-specific
  parameters: ModelParameters;
}

/**
 * Request configuration for AI API calls
 */
export interface AIRequest {
  provider: AIProvider;
  model: string;
  parameters: ModelParameters;
  prompt: string;
  systemMessage?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}