"use strict";
/**
 * @file BaseAIService.ts
 * @description Abstract base class for AI service implementations.
 * Defines the common interface and shared functionality for all AI providers.
 * This architecture allows for dynamic provider switching while maintaining
 * consistent behavior across different AI services.
 *
 * @requires ../../types/aiProvider
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAIService = void 0;
/**
 * Abstract base class for AI service implementations.
 * All AI provider services must extend this class and implement the required methods.
 */
class BaseAIService {
    /**
     * Constructor for base AI service
     * @param provider - The AI provider identifier
     * @param config - Service configuration
     * @param capabilities - Service capabilities
     */
    constructor(provider, config, capabilities) {
        this.provider = provider;
        this.config = config;
        this.capabilities = capabilities;
        this.validateConfig();
    }
    /**
     * Get the provider identifier
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Get service capabilities
     */
    getCapabilities() {
        return Object.assign({}, this.capabilities);
    }
    /**
     * Check if the service is properly configured
     */
    isConfigured() {
        return !!this.config.apiKey;
    }
    /**
     * Handle provider-specific errors and convert them to standard format
     * @param error - The error from the provider
     */
    handleError(error) {
        var _a;
        if (error.response) {
            // HTTP error response
            const status = error.response.status;
            const message = ((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.message) || error.response.statusText || 'Unknown error';
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
        }
        else if (error.request) {
            // Network error
            return new Error('Network error: Unable to reach the AI service');
        }
        else {
            // Other error
            return new Error(error.message || 'Unknown error occurred');
        }
    }
    /**
     * Validate the service configuration
     */
    validateConfig() {
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
    getRequestHeaders() {
        const headers = Object.assign({ 'Content-Type': 'application/json', 'User-Agent': 'SFL-Prompt-Studio/1.0' }, this.config.headers);
        // Add provider-specific authentication headers
        this.addAuthHeaders(headers);
        return headers;
    }
    /**
     * Calculate processing time
     * @param startTime - Request start time
     */
    calculateProcessingTime(startTime) {
        return Date.now() - startTime;
    }
    /**
     * Sanitize parameters to remove undefined/null values
     * @param params - Parameters to sanitize
     */
    sanitizeParameters(params) {
        const sanitized = {};
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
    logRequest(request) {
        var _a, _b;
        if (process.env.NODE_ENV === 'development') {
            const safeRequest = Object.assign({}, request);
            // Remove sensitive data
            if ((_a = safeRequest.headers) === null || _a === void 0 ? void 0 : _a.Authorization) {
                safeRequest.headers.Authorization = '[REDACTED]';
            }
            if ((_b = safeRequest.headers) === null || _b === void 0 ? void 0 : _b['x-api-key']) {
                safeRequest.headers['x-api-key'] = '[REDACTED]';
            }
            console.log(`[${this.provider.toUpperCase()}] Request:`, JSON.stringify(safeRequest, null, 2));
        }
    }
    /**
     * Log response for debugging
     * @param response - The response to log
     */
    logResponse(response) {
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
exports.BaseAIService = BaseAIService;
