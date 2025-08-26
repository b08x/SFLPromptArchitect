/**
 * @file aiProvider.ts
 * @description Backend type definitions for AI provider management and parameter configuration.
 * These types mirror the frontend types to ensure consistency across the application.
 */

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'ollama' | 'cohere' | 'mistral' | 'groq';

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
 * Ollama specific parameters (for local models)
 */
export interface OllamaParameters extends BaseModelParameters {
  /** Top-P/nucleus sampling parameter (0.0 to 1.0) */
  top_p?: number;
  /** Top-K sampling parameter */
  top_k?: number;
  /** Repetition penalty */
  repeat_penalty?: number;
  /** System message */
  system?: string;
  /** Custom options for Ollama */
  options?: Record<string, any>;
}

/**
 * Cohere specific parameters
 */
export interface CohereParameters extends BaseModelParameters {
  /** Top-P/nucleus sampling parameter (0.0 to 1.0) */
  p?: number;
  /** Top-K sampling parameter */
  k?: number;
  /** Frequency penalty (0.0 to 1.0) */
  frequency_penalty?: number;
  /** Presence penalty (0.0 to 1.0) */
  presence_penalty?: number;
  /** System message */
  preamble?: string;
  /** Stop sequences */
  stop_sequences?: string[];
}

/**
 * Mistral specific parameters
 */
export interface MistralParameters extends BaseModelParameters {
  /** Top-P/nucleus sampling parameter (0.0 to 1.0) */
  top_p?: number;
  /** System message */
  system?: string;
  /** Random seed for reproducibility */
  random_seed?: number;
  /** Safe mode for content filtering */
  safe_mode?: boolean;
}

/**
 * Groq specific parameters
 */
export interface GroqParameters extends BaseModelParameters {
  /** Top-P/nucleus sampling parameter (0.0 to 1.0) */
  top_p?: number;
  /** System message */
  system?: string;
  /** Stop sequences */
  stop?: string | string[];
  /** Random seed for reproducibility */
  seed?: number;
}

/**
 * Union type for all provider-specific parameters
 */
export type ModelParameters = 
  | GeminiParameters 
  | OpenAIParameters 
  | AnthropicParameters 
  | OpenRouterParameters
  | OllamaParameters
  | CohereParameters
  | MistralParameters
  | GroqParameters;

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