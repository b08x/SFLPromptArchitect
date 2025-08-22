"use strict";
/**
 * @file AnthropicService.ts
 * @description Anthropic Claude AI service implementation.
 * Provides integration with Anthropic's Claude models including Claude 3.5 Sonnet and Claude 3 Haiku.
 * Handles Anthropic-specific parameter mapping, authentication, and response parsing.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicService = void 0;
exports.createAnthropicService = createAnthropicService;
const axios_1 = __importDefault(require("axios"));
const BaseAIService_1 = require("./BaseAIService");
/**
 * Anthropic service implementation
 */
class AnthropicService extends BaseAIService_1.BaseAIService {
    constructor(config) {
        const capabilities = {
            supportedParameters: [
                'temperature',
                'maxTokens',
                'top_p',
                'top_k',
                'system',
                'stop_sequences'
            ],
            maxContextLength: 200000, // Claude 3.5 context length
            supportsStreaming: true,
            supportsFunctionCalling: false,
            supportsImages: true
        };
        super('anthropic', config, capabilities);
        this.baseUrl = config.baseUrl || 'https://api.anthropic.com';
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: config.timeout || 30000,
            headers: this.getRequestHeaders()
        });
    }
    /**
     * Test connection to Anthropic API
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Anthropic doesn't have a models endpoint, so we test with a minimal request
                const testRequest = {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1,
                    messages: [{
                            role: 'user',
                            content: 'Hi'
                        }]
                };
                const response = yield this.client.post('/v1/messages', testRequest);
                return response.status === 200;
            }
            catch (error) {
                console.error('Anthropic connection test failed:', error);
                return false;
            }
        });
    }
    /**
     * List available Anthropic models
     */
    listModels() {
        return __awaiter(this, void 0, void 0, function* () {
            // Anthropic doesn't provide a models endpoint, so we return known models
            return [
                'claude-3-5-sonnet-20241022',
                'claude-3-haiku-20240307',
                'claude-3-sonnet-20240229',
                'claude-3-opus-20240229'
            ];
        });
    }
    /**
     * Generate completion using Anthropic API
     */
    generateCompletion(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const payload = this.buildRequestPayload(request);
                this.logRequest(payload);
                const response = yield this.client.post('/v1/messages', payload);
                const aiResponse = this.parseResponse(response.data, startTime);
                this.logResponse(aiResponse);
                return aiResponse;
            }
            catch (error) {
                console.error('Anthropic completion failed:', error);
                throw this.handleError(error);
            }
        });
    }
    /**
     * Generate streaming completion (placeholder implementation)
     */
    generateStreamingCompletion(request, onChunk) {
        return __awaiter(this, void 0, void 0, function* () {
            // For now, implement as non-streaming
            // TODO: Implement actual streaming support
            const response = yield this.generateCompletion(request);
            onChunk(response.text);
            return response;
        });
    }
    /**
     * Validate Anthropic parameters
     */
    validateParameters(model, parameters) {
        const errors = [];
        const params = parameters;
        // Validate temperature
        if (params.temperature !== undefined) {
            if (params.temperature < 0 || params.temperature > 1) {
                errors.push('temperature must be between 0 and 1');
            }
        }
        // Validate maxTokens
        if (params.maxTokens !== undefined) {
            if (params.maxTokens < 1 || params.maxTokens > 8192) {
                errors.push('maxTokens must be between 1 and 8192');
            }
        }
        // Validate top_p
        if (params.top_p !== undefined) {
            if (params.top_p < 0 || params.top_p > 1) {
                errors.push('top_p must be between 0 and 1');
            }
        }
        // Validate top_k
        if (params.top_k !== undefined) {
            if (params.top_k < 0 || params.top_k > 200) {
                errors.push('top_k must be between 0 and 200');
            }
        }
        // Validate stop_sequences
        if (params.stop_sequences !== undefined) {
            if (!Array.isArray(params.stop_sequences)) {
                errors.push('stop_sequences must be an array');
            }
            else if (params.stop_sequences.length > 4) {
                errors.push('stop_sequences can have at most 4 sequences');
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Normalize parameters to Anthropic format
     */
    normalizeParameters(parameters) {
        const params = parameters;
        const normalized = {};
        // Map standard parameters
        if (params.temperature !== undefined)
            normalized.temperature = params.temperature;
        if (params.maxTokens !== undefined)
            normalized.max_tokens = params.maxTokens;
        if (params.top_p !== undefined)
            normalized.top_p = params.top_p;
        if (params.top_k !== undefined)
            normalized.top_k = params.top_k;
        if (params.system !== undefined)
            normalized.system = params.system;
        if (params.stop_sequences !== undefined)
            normalized.stop_sequences = params.stop_sequences;
        return this.sanitizeParameters(normalized);
    }
    /**
     * Build Anthropic API request payload
     */
    buildRequestPayload(request) {
        const parameters = this.normalizeParameters(request.parameters);
        const params = request.parameters;
        // Build messages array (Anthropic requires alternating user/assistant messages)
        const messages = [];
        // Add conversation history if provided
        if (request.conversationHistory) {
            request.conversationHistory.forEach(msg => {
                if (msg.role !== 'system') { // System messages are handled separately
                    messages.push({
                        role: msg.role,
                        content: msg.content
                    });
                }
            });
        }
        // Add current prompt
        messages.push({
            role: 'user',
            content: request.prompt
        });
        // Ensure max_tokens is set (required by Anthropic)
        const maxTokens = parameters.max_tokens || 1024;
        delete parameters.max_tokens;
        // Extract system message
        const systemMessage = params.system || request.systemMessage;
        delete parameters.system;
        const payload = Object.assign({ model: request.model, max_tokens: maxTokens, messages }, parameters);
        if (systemMessage) {
            payload.system = systemMessage;
        }
        return payload;
    }
    /**
     * Parse Anthropic response to standard format
     */
    parseResponse(response, startTime) {
        const content = response.content[0];
        if (!content || content.type !== 'text') {
            throw new Error('No text content returned from Anthropic API');
        }
        return {
            text: content.text,
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens
            },
            metadata: {
                id: response.id,
                stopReason: response.stop_reason,
                stopSequence: response.stop_sequence
            },
            model: response.model,
            processingTime: this.calculateProcessingTime(startTime)
        };
    }
    /**
     * Add Anthropic-specific authentication headers
     */
    addAuthHeaders(headers) {
        headers['x-api-key'] = this.config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
    }
}
exports.AnthropicService = AnthropicService;
/**
 * Factory function for creating Anthropic service instances
 */
function createAnthropicService(config) {
    return new AnthropicService(config);
}
