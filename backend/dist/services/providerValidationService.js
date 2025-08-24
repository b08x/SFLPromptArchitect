"use strict";
/**
 * @file providerValidationService.ts
 * @description Service for validating AI provider API keys and detecting available providers from environment variables
 * @since 0.6.0
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
exports.detectAvailableProviders = detectAvailableProviders;
exports.getProviderConfig = getProviderConfig;
exports.validateProviderApiKey = validateProviderApiKey;
exports.validateAllProviders = validateAllProviders;
exports.hasValidProvider = hasValidProvider;
exports.getPreferredProvider = getPreferredProvider;
const env_1 = __importDefault(require("../config/env"));
/**
 * Detects which AI providers are configured via environment variables
 * @returns Promise resolving to array of provider availability information
 */
function detectAvailableProviders() {
    return __awaiter(this, void 0, void 0, function* () {
        const [geminiApiKey, openaiApiKey, openrouterApiKey, anthropicApiKey] = yield Promise.all([
            env_1.default.getGeminiApiKey().catch(() => ''),
            env_1.default.getOpenaiApiKey().catch(() => ''),
            env_1.default.getOpenrouterApiKey().catch(() => ''),
            env_1.default.getAnthropicApiKey().catch(() => '')
        ]);
        const providers = [
            {
                provider: 'google',
                hasApiKey: !!geminiApiKey,
                isConfigured: !!(geminiApiKey && env_1.default.googleDefaultModel),
            },
            {
                provider: 'openai',
                hasApiKey: !!openaiApiKey,
                isConfigured: !!(openaiApiKey && env_1.default.openaiDefaultModel),
            },
            {
                provider: 'openrouter',
                hasApiKey: !!openrouterApiKey,
                isConfigured: !!(openrouterApiKey && env_1.default.openrouterDefaultModel && env_1.default.openrouterBaseUrl),
            },
            {
                provider: 'anthropic',
                hasApiKey: !!anthropicApiKey,
                isConfigured: !!(anthropicApiKey && env_1.default.anthropicDefaultModel),
            },
        ];
        return providers;
    });
}
/**
 * Gets the configured provider settings
 * @param provider The AI provider
 * @returns Promise resolving to provider configuration or null if not configured
 */
function getProviderConfig(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            switch (provider) {
                case 'google': {
                    const apiKey = yield env_1.default.getGeminiApiKey();
                    if (!apiKey)
                        return null;
                    return {
                        apiKey,
                        defaultModel: env_1.default.googleDefaultModel,
                    };
                }
                case 'openai': {
                    const apiKey = yield env_1.default.getOpenaiApiKey();
                    if (!apiKey)
                        return null;
                    return {
                        apiKey,
                        defaultModel: env_1.default.openaiDefaultModel,
                    };
                }
                case 'openrouter': {
                    const apiKey = yield env_1.default.getOpenrouterApiKey();
                    if (!apiKey)
                        return null;
                    return {
                        apiKey,
                        defaultModel: env_1.default.openrouterDefaultModel,
                        baseUrl: env_1.default.openrouterBaseUrl,
                    };
                }
                case 'anthropic': {
                    const apiKey = yield env_1.default.getAnthropicApiKey();
                    if (!apiKey)
                        return null;
                    return {
                        apiKey,
                        defaultModel: env_1.default.anthropicDefaultModel,
                    };
                }
                default:
                    return null;
            }
        }
        catch (error) {
            console.error(`Failed to get provider config for ${provider}:`, error);
            return null;
        }
    });
}
/**
 * Validates an API key by making a request to the provider's API
 * @param provider The AI provider
 * @param apiKey The API key to validate
 * @param baseUrl Optional base URL for OpenRouter/custom providers
 * @returns Promise resolving to validation result
 */
function validateProviderApiKey(provider, apiKey, baseUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!apiKey || apiKey.trim().length === 0) {
            return { success: false, error: 'API key cannot be empty' };
        }
        try {
            switch (provider) {
                case 'google': {
                    const response = yield fetch('https://generativelanguage.googleapis.com/v1beta/models', {
                        method: 'GET',
                        headers: {
                            'x-goog-api-key': apiKey,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (!response.ok) {
                        if (response.status === 401) {
                            return { success: false, error: 'Invalid Google API key' };
                        }
                        else if (response.status === 403) {
                            return { success: false, error: 'Google API key does not have permission to access Generative AI models' };
                        }
                        else if (response.status === 429) {
                            return { success: false, error: 'Rate limit exceeded for Google API' };
                        }
                        else {
                            return { success: false, error: `Google API error: ${response.status} ${response.statusText}` };
                        }
                    }
                    return { success: true };
                }
                case 'openai': {
                    const url = baseUrl || 'https://api.openai.com';
                    const response = yield fetch(`${url}/v1/models`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (!response.ok) {
                        if (response.status === 401) {
                            return { success: false, error: 'Invalid OpenAI API key' };
                        }
                        else if (response.status === 403) {
                            return { success: false, error: 'OpenAI API key does not have permission to access models' };
                        }
                        else if (response.status === 429) {
                            return { success: false, error: 'Rate limit exceeded for OpenAI API' };
                        }
                        else {
                            return { success: false, error: `OpenAI API error: ${response.status} ${response.statusText}` };
                        }
                    }
                    return { success: true };
                }
                case 'openrouter': {
                    const url = baseUrl || env_1.default.openrouterBaseUrl;
                    const response = yield fetch(`${url}/models`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (!response.ok) {
                        if (response.status === 401) {
                            return { success: false, error: 'Invalid OpenRouter API key' };
                        }
                        else if (response.status === 403) {
                            return { success: false, error: 'OpenRouter API key does not have permission to access models' };
                        }
                        else if (response.status === 429) {
                            return { success: false, error: 'Rate limit exceeded for OpenRouter API' };
                        }
                        else {
                            return { success: false, error: `OpenRouter API error: ${response.status} ${response.statusText}` };
                        }
                    }
                    return { success: true };
                }
                case 'anthropic': {
                    // Note: Anthropic doesn't have a simple models endpoint like others
                    // We'll do a minimal completion request to validate the key
                    const response = yield fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'anthropic-version': '2023-06-01',
                        },
                        body: JSON.stringify({
                            model: 'claude-3-haiku-20240307',
                            max_tokens: 1,
                            messages: [{ role: 'user', content: 'test' }],
                        }),
                    });
                    if (!response.ok) {
                        if (response.status === 401) {
                            return { success: false, error: 'Invalid Anthropic API key' };
                        }
                        else if (response.status === 403) {
                            return { success: false, error: 'Anthropic API key does not have permission to access Claude' };
                        }
                        else if (response.status === 429) {
                            return { success: false, error: 'Rate limit exceeded for Anthropic API' };
                        }
                        else {
                            return { success: false, error: `Anthropic API error: ${response.status} ${response.statusText}` };
                        }
                    }
                    return { success: true };
                }
                default:
                    return { success: false, error: `Unsupported provider: ${provider}` };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Network error validating ${provider} API key: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    });
}
/**
 * Validates all configured providers
 * @returns Promise resolving to array of provider availability with validation results
 */
function validateAllProviders() {
    return __awaiter(this, void 0, void 0, function* () {
        const providers = yield detectAvailableProviders();
        const validationPromises = providers.map((provider) => __awaiter(this, void 0, void 0, function* () {
            if (!provider.hasApiKey) {
                return Object.assign(Object.assign({}, provider), { validationResult: { success: false, error: 'No API key configured' } });
            }
            const providerConfig = yield getProviderConfig(provider.provider);
            if (!providerConfig) {
                return Object.assign(Object.assign({}, provider), { validationResult: { success: false, error: 'Provider not configured' } });
            }
            const validationResult = yield validateProviderApiKey(provider.provider, providerConfig.apiKey, providerConfig.baseUrl);
            return Object.assign(Object.assign({}, provider), { validationResult });
        }));
        return yield Promise.all(validationPromises);
    });
}
/**
 * Checks if at least one provider is valid and configured
 * @returns Promise resolving to boolean indicating if any provider is available
 */
function hasValidProvider() {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield validateAllProviders();
        return results.some(result => { var _a; return ((_a = result.validationResult) === null || _a === void 0 ? void 0 : _a.success) === true; });
    });
}
/**
 * Gets the preferred provider based on configuration and availability
 * @returns Promise resolving to the preferred provider or null if none available
 */
function getPreferredProvider() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const results = yield validateAllProviders();
        // First try the default provider
        const defaultProvider = results.find(r => r.provider === env_1.default.defaultAiProvider);
        if ((_a = defaultProvider === null || defaultProvider === void 0 ? void 0 : defaultProvider.validationResult) === null || _a === void 0 ? void 0 : _a.success) {
            return defaultProvider.provider;
        }
        // Then try the fallback provider
        const fallbackProvider = results.find(r => r.provider === env_1.default.fallbackAiProvider);
        if ((_b = fallbackProvider === null || fallbackProvider === void 0 ? void 0 : fallbackProvider.validationResult) === null || _b === void 0 ? void 0 : _b.success) {
            return fallbackProvider.provider;
        }
        // Finally, return the first valid provider
        const validProvider = results.find(r => { var _a; return (_a = r.validationResult) === null || _a === void 0 ? void 0 : _a.success; });
        return (validProvider === null || validProvider === void 0 ? void 0 : validProvider.provider) || null;
    });
}
