"use strict";
/**
 * @file AIProviderFactory.ts
 * @description Factory for creating AI service instances dynamically based on provider type.
 * This factory enables runtime provider switching and manages service instantiation
 * with proper configuration and error handling.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiProviderFactory = exports.AIProviderFactory = void 0;
exports.createAIService = createAIService;
exports.testAIProviderConnection = testAIProviderConnection;
const OpenAIService_1 = require("./OpenAIService");
const AnthropicService_1 = require("./AnthropicService");
const GeminiService_1 = require("./GeminiService");
/**
 * Service factory registry
 */
const SERVICE_FACTORIES = {
    openai: OpenAIService_1.createOpenAIService,
    anthropic: AnthropicService_1.createAnthropicService,
    google: GeminiService_1.createGeminiService,
    openrouter: (config) => {
        throw new Error('OpenRouter service not yet implemented');
    }
};
/**
 * Service instance cache for reusing configured services
 */
class ServiceCache {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 10;
    }
    /**
     * Generate cache key for a service configuration
     */
    getCacheKey(provider, apiKey, baseUrl) {
        // Use first 8 characters of API key hash for cache key (security)
        const keyHash = Buffer.from(apiKey).toString('base64').substring(0, 8);
        return `${provider}:${keyHash}:${baseUrl || 'default'}`;
    }
    /**
     * Get cached service instance
     */
    get(provider, config) {
        const key = this.getCacheKey(provider, config.apiKey, config.baseUrl);
        return this.cache.get(key);
    }
    /**
     * Cache service instance
     */
    set(provider, config, service) {
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
    clear() {
        this.cache.clear();
    }
    /**
     * Remove specific service from cache
     */
    remove(provider, config) {
        const key = this.getCacheKey(provider, config.apiKey, config.baseUrl);
        this.cache.delete(key);
    }
    /**
     * Get cache statistics
     */
    getStats() {
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
class AIProviderFactory {
    constructor() {
        this.serviceCache = new ServiceCache();
    }
    /**
     * Get singleton instance of the factory
     */
    static getInstance() {
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
    createService(provider, config, useCache = true) {
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
        }
        catch (error) {
            throw new Error(`Failed to create ${provider} service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Test if a provider is supported
     */
    isProviderSupported(provider) {
        return provider in SERVICE_FACTORIES;
    }
    /**
     * Get list of supported providers
     */
    getSupportedProviders() {
        return Object.keys(SERVICE_FACTORIES);
    }
    /**
     * Get list of implemented providers (excluding placeholder implementations)
     */
    getImplementedProviders() {
        const implemented = [];
        for (const provider of Object.keys(SERVICE_FACTORIES)) {
            try {
                // Try to create a dummy service to check if implemented
                const dummyConfig = { apiKey: 'test' };
                SERVICE_FACTORIES[provider](dummyConfig);
                implemented.push(provider);
            }
            catch (error) {
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
    testProviderConnection(provider, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const service = this.createService(provider, config, false); // Don't cache test instances
                return yield service.testConnection();
            }
            catch (error) {
                console.error(`Failed to test ${provider} connection:`, error);
                return false;
            }
        });
    }
    /**
     * Get service capabilities for a provider
     * @param provider - The provider to query
     * @param config - Configuration for the service
     */
    getProviderCapabilities(provider, config) {
        const service = this.createService(provider, config);
        return service.getCapabilities();
    }
    /**
     * Clear service cache
     */
    clearCache() {
        this.serviceCache.clear();
    }
    /**
     * Remove specific service from cache
     */
    removeCachedService(provider, config) {
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
    validateConfig(config) {
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
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.AIProviderFactory = AIProviderFactory;
/**
 * Convenience function to get factory instance
 */
exports.aiProviderFactory = AIProviderFactory.getInstance();
/**
 * Convenience function to create AI service
 */
function createAIService(provider, config) {
    return exports.aiProviderFactory.createService(provider, config);
}
/**
 * Convenience function to test provider connection
 */
function testAIProviderConnection(provider, config) {
    return __awaiter(this, void 0, void 0, function* () {
        return exports.aiProviderFactory.testProviderConnection(provider, config);
    });
}
