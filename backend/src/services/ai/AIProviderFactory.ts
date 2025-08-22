/**
 * @file AIProviderFactory.ts
 * @description Factory for creating AI service instances dynamically based on provider type.
 * This factory enables runtime provider switching and manages service instantiation
 * with proper configuration and error handling.
 */

import { BaseAIService, AIServiceConfig } from './BaseAIService';
import { AIProvider } from '../../types/aiProvider';
import { createOpenAIService } from './OpenAIService';
import { createAnthropicService } from './AnthropicService';
import { createGeminiService } from './GeminiService';
// TODO: Import other services when implemented
// import { createOpenRouterService } from './OpenRouterService';

/**
 * Registry of available AI service factories
 */
type ServiceFactoryMap = {
  [K in AIProvider]: (config: AIServiceConfig) => BaseAIService;
};

/**
 * Service factory registry
 */
const SERVICE_FACTORIES: ServiceFactoryMap = {
  openai: createOpenAIService,
  anthropic: createAnthropicService,
  google: createGeminiService,
  openrouter: (config: AIServiceConfig) => {
    throw new Error('OpenRouter service not yet implemented');
  }
};

/**
 * Service instance cache for reusing configured services
 */
class ServiceCache {
  private cache = new Map<string, BaseAIService>();
  private readonly maxCacheSize = 10;

  /**
   * Generate cache key for a service configuration
   */
  private getCacheKey(provider: AIProvider, apiKey: string, baseUrl?: string): string {
    // Use first 8 characters of API key hash for cache key (security)
    const keyHash = Buffer.from(apiKey).toString('base64').substring(0, 8);
    return `${provider}:${keyHash}:${baseUrl || 'default'}`;
  }

  /**
   * Get cached service instance
   */
  get(provider: AIProvider, config: AIServiceConfig): BaseAIService | undefined {
    const key = this.getCacheKey(provider, config.apiKey, config.baseUrl);
    return this.cache.get(key);
  }

  /**
   * Cache service instance
   */
  set(provider: AIProvider, config: AIServiceConfig, service: BaseAIService): void {
    const key = this.getCacheKey(provider, config.apiKey, config.baseUrl);
    
    // Implement LRU cache behavior
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, service);
  }

  /**
   * Clear cache (useful for testing or when configurations change)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove specific service from cache
   */
  remove(provider: AIProvider, config: AIServiceConfig): void {
    const key = this.getCacheKey(provider, config.apiKey, config.baseUrl);
    this.cache.delete(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * AI Provider Factory class
 */
export class AIProviderFactory {
  private static instance: AIProviderFactory;
  private serviceCache: ServiceCache;

  private constructor() {
    this.serviceCache = new ServiceCache();
  }

  /**
   * Get singleton instance of the factory
   */
  static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }

  /**
   * Create or retrieve AI service instance
   * @param provider - The AI provider to create service for
   * @param config - Configuration for the service
   * @param useCache - Whether to use cached instances (default: true)
   */
  createService(provider: AIProvider, config: AIServiceConfig, useCache: boolean = true): BaseAIService {
    // Validate provider
    if (!this.isProviderSupported(provider)) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    // Validate configuration
    this.validateConfig(config);

    // Check cache first if enabled
    if (useCache) {
      const cachedService = this.serviceCache.get(provider, config);
      if (cachedService) {
        return cachedService;
      }
    }

    try {
      // Create new service instance
      const factory = SERVICE_FACTORIES[provider];
      const service = factory(config);

      // Cache the service if enabled
      if (useCache) {
        this.serviceCache.set(provider, config, service);
      }

      return service;
    } catch (error) {
      throw new Error(`Failed to create ${provider} service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test if a provider is supported
   */
  isProviderSupported(provider: AIProvider): boolean {
    return provider in SERVICE_FACTORIES;
  }

  /**
   * Get list of supported providers
   */
  getSupportedProviders(): AIProvider[] {
    return Object.keys(SERVICE_FACTORIES) as AIProvider[];
  }

  /**
   * Get list of implemented providers (excluding placeholder implementations)
   */
  getImplementedProviders(): AIProvider[] {
    const implemented: AIProvider[] = [];
    
    for (const provider of Object.keys(SERVICE_FACTORIES) as AIProvider[]) {
      try {
        // Try to create a dummy service to check if implemented
        const dummyConfig: AIServiceConfig = { apiKey: 'test' };
        SERVICE_FACTORIES[provider](dummyConfig);
        implemented.push(provider);
      } catch (error) {
        // Provider not yet implemented
        if (error instanceof Error && error.message.includes('not yet implemented')) {
          continue;
        }
        // Other errors mean the provider is implemented but configuration failed
        implemented.push(provider);
      }
    }
    
    return implemented;
  }

  /**
   * Test connection for a provider
   * @param provider - The provider to test
   * @param config - Configuration for the test
   */
  async testProviderConnection(provider: AIProvider, config: AIServiceConfig): Promise<boolean> {
    try {
      const service = this.createService(provider, config, false); // Don't cache test instances
      return await service.testConnection();
    } catch (error) {
      console.error(`Failed to test ${provider} connection:`, error);
      return false;
    }
  }

  /**
   * Get service capabilities for a provider
   * @param provider - The provider to query
   * @param config - Configuration for the service
   */
  getProviderCapabilities(provider: AIProvider, config: AIServiceConfig) {
    const service = this.createService(provider, config);
    return service.getCapabilities();
  }

  /**
   * Clear service cache
   */
  clearCache(): void {
    this.serviceCache.clear();
  }

  /**
   * Remove specific service from cache
   */
  removeCachedService(provider: AIProvider, config: AIServiceConfig): void {
    this.serviceCache.remove(provider, config);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.serviceCache.getStats();
  }

  /**
   * Validate service configuration
   */
  private validateConfig(config: AIServiceConfig): void {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API key is required');
    }

    if (config.timeout && config.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }

    if (config.baseUrl && !this.isValidUrl(config.baseUrl)) {
      throw new Error('Invalid base URL format');
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Convenience function to get factory instance
 */
export const aiProviderFactory = AIProviderFactory.getInstance();

/**
 * Convenience function to create AI service
 */
export function createAIService(provider: AIProvider, config: AIServiceConfig): BaseAIService {
  return aiProviderFactory.createService(provider, config);
}

/**
 * Convenience function to test provider connection
 */
export async function testAIProviderConnection(provider: AIProvider, config: AIServiceConfig): Promise<boolean> {
  return aiProviderFactory.testProviderConnection(provider, config);
}