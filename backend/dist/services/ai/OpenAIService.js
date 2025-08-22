"use strict";
/**
 * @file OpenAIService.ts
 * @description OpenAI AI service implementation.
 * Provides integration with OpenAI's GPT models including GPT-4, GPT-4 Turbo, and GPT-3.5.
 * Handles OpenAI-specific parameter mapping, authentication, and response parsing.
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
exports.OpenAIService = void 0;
exports.createOpenAIService = createOpenAIService;
const axios_1 = __importDefault(require("axios"));
const BaseAIService_1 = require("./BaseAIService");
/**
 * OpenAI service implementation
 */
class OpenAIService extends BaseAIService_1.BaseAIService {
    constructor(config) {
        const capabilities = {
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
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: config.timeout || 30000,
            headers: this.getRequestHeaders()
        });
    }
    /**
     * Test connection to OpenAI API
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get('/models');
                return response.status === 200;
            }
            catch (error) {
                console.error('OpenAI connection test failed:', error);
                return false;
            }
        });
    }
    /**
     * List available OpenAI models
     */
    listModels() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get('/models');
                // Filter to only include GPT models that are relevant for text generation
                const gptModels = response.data.data
                    .filter((model) => model.id.includes('gpt') &&
                    !model.id.includes('instruct') &&
                    !model.id.includes('edit') &&
                    !model.id.includes('whisper') &&
                    !model.id.includes('tts') &&
                    !model.id.includes('dall-e'))
                    .map((model) => model.id)
                    .sort();
                return gptModels;
            }
            catch (error) {
                console.error('Failed to list OpenAI models:', error);
                throw this.handleError(error);
            }
        });
    }
    /**
     * Generate completion using OpenAI API
     */
    generateCompletion(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const payload = this.buildRequestPayload(request);
                this.logRequest(payload);
                const response = yield this.client.post('/chat/completions', payload);
                const aiResponse = this.parseResponse(response.data, startTime);
                this.logResponse(aiResponse);
                return aiResponse;
            }
            catch (error) {
                console.error('OpenAI completion failed:', error);
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
     * Validate OpenAI parameters
     */
    validateParameters(model, parameters) {
        const errors = [];
        const params = parameters;
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
        if (params.presence_penalty !== undefined)
            normalized.presence_penalty = params.presence_penalty;
        if (params.frequency_penalty !== undefined)
            normalized.frequency_penalty = params.frequency_penalty;
        if (params.n !== undefined)
            normalized.n = params.n;
        if (params.stop !== undefined)
            normalized.stop = params.stop;
        return this.sanitizeParameters(normalized);
    }
    /**
     * Build OpenAI API request payload
     */
    buildRequestPayload(request) {
        const parameters = this.normalizeParameters(request.parameters);
        const params = request.parameters;
        // Build messages array
        const messages = [];
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
        return Object.assign({ model: request.model, messages }, parameters);
    }
    /**
     * Parse OpenAI response to standard format
     */
    parseResponse(response, startTime) {
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
    addAuthHeaders(headers) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
}
exports.OpenAIService = OpenAIService;
/**
 * Factory function for creating OpenAI service instances
 */
function createOpenAIService(config) {
    return new OpenAIService(config);
}
