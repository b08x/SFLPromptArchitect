"use strict";
/**
 * @file GeminiService.ts
 * @description Google Gemini AI service implementation.
 * Provides integration with Google's Gemini models including Gemini Pro and Gemini Flash.
 * Handles Gemini-specific parameter mapping, authentication, and response parsing.
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
exports.GeminiService = void 0;
exports.createGeminiService = createGeminiService;
const axios_1 = __importDefault(require("axios"));
const BaseAIService_1 = require("./BaseAIService");
/**
 * Gemini service implementation
 */
class GeminiService extends BaseAIService_1.BaseAIService {
    constructor(config) {
        const capabilities = {
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
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: config.timeout || 60000,
            headers: this.getRequestHeaders()
        });
    }
    /**
     * Test connection to Gemini API
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Test with a simple model listing request
                const response = yield this.client.get(`/models?key=${this.config.apiKey}`);
                return response.status === 200;
            }
            catch (error) {
                console.error('Gemini connection test failed:', error);
                return false;
            }
        });
    }
    /**
     * List available Gemini models
     */
    listModels() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.get(`/models?key=${this.config.apiKey}`);
                if (response.data && response.data.models) {
                    return response.data.models
                        .filter((model) => model.name.includes('gemini'))
                        .map((model) => model.name.replace('models/', ''))
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
            }
            catch (error) {
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
        });
    }
    /**
     * Generate completion using Gemini API
     */
    generateCompletion(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const payload = this.buildRequestPayload(request);
                this.logRequest(payload);
                const modelName = this.normalizeModelName(request.model);
                const url = `/models/${modelName}:generateContent?key=${this.config.apiKey}`;
                const response = yield this.client.post(url, payload);
                const aiResponse = this.parseResponse(response.data, startTime);
                this.logResponse(aiResponse);
                return aiResponse;
            }
            catch (error) {
                console.error('Gemini completion failed:', error);
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
            // TODO: Implement actual streaming support using streamGenerateContent
            const response = yield this.generateCompletion(request);
            onChunk(response.text);
            return response;
        });
    }
    /**
     * Validate Gemini parameters
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
     * Normalize parameters to Gemini format
     */
    normalizeParameters(parameters) {
        const params = parameters;
        const normalized = {};
        // Map to Gemini generationConfig format
        const generationConfig = {};
        if (params.temperature !== undefined)
            generationConfig.temperature = params.temperature;
        if (params.maxTokens !== undefined)
            generationConfig.maxOutputTokens = params.maxTokens;
        if (params.topK !== undefined)
            generationConfig.topK = params.topK;
        if (params.topP !== undefined)
            generationConfig.topP = params.topP;
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
     * Build Gemini API request payload
     */
    buildRequestPayload(request) {
        const parameters = this.normalizeParameters(request.parameters);
        const params = request.parameters;
        // Build contents array
        const contents = [];
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
        const payload = Object.assign({ contents }, parameters);
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
    parseResponse(response, startTime) {
        var _a, _b, _c, _d;
        const candidate = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0];
        if (!candidate) {
            throw new Error('No candidates returned from Gemini API');
        }
        const text = ((_d = (_c = (_b = candidate.content) === null || _b === void 0 ? void 0 : _b.parts) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.text) || '';
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
    addAuthHeaders(headers) {
        // Gemini uses API key in query params, not headers
        // But we include it here for completeness
        headers['x-goog-api-key'] = this.config.apiKey;
    }
    /**
     * Normalize model name for Gemini API
     */
    normalizeModelName(model) {
        // Remove 'models/' prefix if present
        if (model.startsWith('models/')) {
            return model.substring(7);
        }
        return model;
    }
}
exports.GeminiService = GeminiService;
/**
 * Factory function for creating Gemini service instances
 */
function createGeminiService(config) {
    return new GeminiService(config);
}
