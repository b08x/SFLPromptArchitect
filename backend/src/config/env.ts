/**
 * @file env.ts
 * @description Environment configuration module that integrates with secure secrets management
 * while maintaining backward compatibility with environment variables for development.
 * 
 * Features:
 * - Runtime secret retrieval from HashiCorp Vault in production
 * - Graceful fallback to environment variables in development
 * - Lazy loading of sensitive configuration values
 * - Comprehensive configuration validation and error handling
 * 
 * @requires dotenv
 * @since 0.6.0
 */

import dotenv from 'dotenv';
import secretsManager from './secrets';

// Load environment variables from .env file
dotenv.config();

/**
 * @interface Config
 * @description Type definition for the application configuration object.
 * All secret values are now retrieved at runtime rather than at module load time.
 */
interface Config {
  /** Get the connection URL for the PostgreSQL database */
  getDatabaseUrl(): Promise<string>;
  /** Get the connection URL for the Redis server */
  getRedisUrl(): Promise<string>;
  /** Get the API key for accessing Google's Gemini AI service via @ai-sdk/google */
  getGeminiApiKey(): Promise<string>;
  /** Get the API key for accessing OpenAI's service */
  getOpenaiApiKey(): Promise<string>;
  /** Get the API key for accessing OpenRouter's service */
  getOpenrouterApiKey(): Promise<string>;
  /** Get the API key for accessing Anthropic's Claude service */
  getAnthropicApiKey(): Promise<string>;
  /** Get the API key for accessing Ollama service */
  getOllamaApiKey(): Promise<string>;
  /** Get the API key for accessing Cohere service */
  getCohereApiKey(): Promise<string>;
  /** Get the API key for accessing Mistral service */
  getMistralApiKey(): Promise<string>;
  /** Get the API key for accessing Groq service */
  getGroqApiKey(): Promise<string>;
  /** Get JWT signing secret */
  getJWTSecret(): Promise<string>;
  /** Get session secret */
  getSessionSecret(): Promise<string>;
  /** Get API key for a specific provider */
  getProviderApiKey(provider: string): Promise<string>;
  /** The default AI provider to use */
  defaultAiProvider: string;
  /** The fallback AI provider if default fails */
  fallbackAiProvider: string;
  /** OpenAI default model */
  openaiDefaultModel: string;
  /** Google default model */
  googleDefaultModel: string;
  /** OpenRouter default model */
  openrouterDefaultModel: string;
  /** OpenRouter base URL */
  openrouterBaseUrl: string;
  /** Anthropic default model */
  anthropicDefaultModel: string;
  /** Ollama default model */
  ollamaDefaultModel: string;
  /** Cohere default model */
  cohereDefaultModel: string;
  /** Mistral default model */
  mistralDefaultModel: string;
  /** Groq default model */
  groqDefaultModel: string;
  /** Whether grounding is enabled */
  enableGrounding: boolean;
  /** The current environment (development, production, test) */
  nodeEnv: string;
  /** The port number for the application server */
  port: string | number;
  /** Check system health including secrets availability */
  healthCheck(): Promise<{ secrets: boolean; vault: boolean; fallback: boolean }>;
}

/**
 * Application configuration object with secure secrets management integration.
 * Provides centralized access to environment-specific settings with runtime secret retrieval.
 * 
 * @type {Config}
 * 
 * @example
 * ```typescript
 * import config from './config/env';
 * 
 * console.log(`Starting server on port ${config.port}`);
 * console.log(`Environment: ${config.nodeEnv}`);
 * 
 * // Async secret retrieval
 * const dbUrl = await config.getDatabaseUrl();
 * const apiKey = await config.getProviderApiKey('openai');
 * ```
 * 
 * @since 0.6.0
 */
export default {
  // Async methods for secure secrets
  async getDatabaseUrl(): Promise<string> {
    return await secretsManager.getDatabaseUrl();
  },

  async getRedisUrl(): Promise<string> {
    return await secretsManager.getRedisUrl();
  },

  async getGeminiApiKey(): Promise<string> {
    return await secretsManager.getProviderApiKey('google');
  },

  async getOpenaiApiKey(): Promise<string> {
    return await secretsManager.getProviderApiKey('openai');
  },

  async getOpenrouterApiKey(): Promise<string> {
    return await secretsManager.getProviderApiKey('openrouter');
  },

  async getAnthropicApiKey(): Promise<string> {
    return await secretsManager.getProviderApiKey('anthropic');
  },

  async getOllamaApiKey(): Promise<string> {
    // Ollama doesn't require an API key (local deployment)
    return '';
  },

  async getCohereApiKey(): Promise<string> {
    return await secretsManager.getProviderApiKey('cohere');
  },

  async getMistralApiKey(): Promise<string> {
    return await secretsManager.getProviderApiKey('mistral');
  },

  async getGroqApiKey(): Promise<string> {
    return await secretsManager.getProviderApiKey('groq');
  },

  async getJWTSecret(): Promise<string> {
    return await secretsManager.getJWTSecret();
  },

  async getSessionSecret(): Promise<string> {
    return await secretsManager.getSessionSecret();
  },

  async getProviderApiKey(provider: string): Promise<string> {
    return await secretsManager.getProviderApiKey(provider);
  },

  // Non-sensitive configuration (immediate access)
  defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || 'google',
  fallbackAiProvider: process.env.FALLBACK_AI_PROVIDER || 'openai',
  openaiDefaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
  googleDefaultModel: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.5-flash',
  openrouterDefaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4',
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  anthropicDefaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet',
  ollamaDefaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3.2:1b',
  cohereDefaultModel: process.env.COHERE_DEFAULT_MODEL || 'command',
  mistralDefaultModel: process.env.MISTRAL_DEFAULT_MODEL || 'mistral-tiny',
  groqDefaultModel: process.env.GROQ_DEFAULT_MODEL || 'llama3-8b-8192',
  enableGrounding: process.env.ENABLE_GROUNDING === 'true',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,

  // Health check method
  async healthCheck(): Promise<{ secrets: boolean; vault: boolean; fallback: boolean }> {
    try {
      const health = await secretsManager.healthCheck();
      return {
        secrets: true,
        vault: health.vault,
        fallback: health.fallback
      };
    } catch (error) {
      console.error('Config health check failed:', error);
      return {
        secrets: false,
        vault: false,
        fallback: true
      };
    }
  }
} as Config;