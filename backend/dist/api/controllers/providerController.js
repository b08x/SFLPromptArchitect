"use strict";
/**
 * @file providerController.ts
 * @description Controller for AI provider validation and status endpoints with secure key management
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
const crypto_1 = __importDefault(require("crypto"));
const providerValidationService_1 = require("../../services/providerValidationService");
const unifiedAIService_1 = require("../../services/unifiedAIService");
/**
 * Encryption configuration for API keys
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || crypto_1.default.randomBytes(32).toString('hex');
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
/**
 * Controller class for managing AI provider validation and configuration
 */
class ProviderController {
    /**
     * Get the status of all available providers
     * @route GET /api/providers/status
     */
    static getProviderStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const providers = yield (0, providerValidationService_1.validateAllProviders)();
                const hasAnyValid = providers.some(p => { var _a; return ((_a = p.validationResult) === null || _a === void 0 ? void 0 : _a.success) === true; });
                const preferredProvider = yield (0, providerValidationService_1.getPreferredProvider)();
                res.json({
                    success: true,
                    data: {
                        providers,
                        hasValidProvider: hasAnyValid,
                        preferredProvider,
                    },
                });
            }
            catch (error) {
                console.error('Error checking provider status:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to check provider status',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Get available providers without validation (faster)
     * @route GET /api/providers/available
     */
    static getAvailableProviders(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const providers = (0, providerValidationService_1.detectAvailableProviders)();
                res.json({
                    success: true,
                    data: {
                        providers,
                    },
                });
            }
            catch (error) {
                console.error('Error getting available providers:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get available providers',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Check if at least one provider is valid and ready
     * @route GET /api/providers/health
     */
    static checkProviderHealth(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isHealthy = yield (0, providerValidationService_1.hasValidProvider)();
                const preferredProvider = yield (0, providerValidationService_1.getPreferredProvider)();
                res.json({
                    success: true,
                    data: {
                        healthy: isHealthy,
                        preferredProvider,
                        requiresSetup: !isHealthy,
                    },
                });
            }
            catch (error) {
                console.error('Error checking provider health:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to check provider health',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Validate a specific provider's API key
     * @route POST /api/providers/validate
     * @body { provider: string, apiKey: string, baseUrl?: string }
     */
    static validateProvider(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { provider, apiKey, baseUrl } = req.body;
                if (!provider || !apiKey) {
                    res.status(400).json({
                        success: false,
                        error: 'Provider and API key are required',
                    });
                    return;
                }
                // Validate provider type
                const validProviders = ['google', 'openai', 'openrouter', 'anthropic'];
                if (!validProviders.includes(provider)) {
                    res.status(400).json({
                        success: false,
                        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
                    });
                    return;
                }
                const result = yield (0, providerValidationService_1.validateProviderApiKey)(provider, apiKey, baseUrl);
                res.json({
                    success: true,
                    data: {
                        provider,
                        validation: result,
                    },
                });
            }
            catch (error) {
                console.error('Error validating provider:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to validate provider',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Get the preferred provider based on configuration
     * @route GET /api/providers/preferred
     */
    static getPreferredProvider(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const preferredProvider = yield (0, providerValidationService_1.getPreferredProvider)();
                if (!preferredProvider) {
                    res.status(404).json({
                        success: false,
                        error: 'No valid provider available',
                        data: {
                            preferredProvider: null,
                            requiresSetup: true,
                        },
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: {
                        preferredProvider,
                        requiresSetup: false,
                    },
                });
            }
            catch (error) {
                console.error('Error getting preferred provider:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get preferred provider',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Securely save an API key to the user's session
     * @route POST /api/providers/save-key
     * @body { provider: string, apiKey: string, baseUrl?: string }
     */
    static saveApiKey(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { provider, apiKey, baseUrl } = req.body;
                // Input validation
                if (!provider || !apiKey) {
                    res.status(400).json({
                        success: false,
                        error: 'Provider and API key are required',
                    });
                    return;
                }
                // Validate provider type
                const validProviders = ['google', 'openai', 'openrouter', 'anthropic'];
                if (!validProviders.includes(provider)) {
                    res.status(400).json({
                        success: false,
                        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
                    });
                    return;
                }
                // Sanitize API key
                const sanitizedApiKey = apiKey.trim();
                if (sanitizedApiKey.length < 10) {
                    res.status(400).json({
                        success: false,
                        error: 'API key appears to be invalid (too short)',
                    });
                    return;
                }
                // Validate the API key before storing
                const validation = yield (0, providerValidationService_1.validateProviderApiKey)(provider, sanitizedApiKey, baseUrl);
                if (!validation.success) {
                    res.status(400).json({
                        success: false,
                        error: `Invalid API key: ${validation.error}`,
                    });
                    return;
                }
                // Encrypt and store the API key in session
                const encryptedData = ProviderController.encryptApiKey(sanitizedApiKey);
                if (!req.session) {
                    req.session = {};
                }
                if (!req.session.apiKeys) {
                    req.session.apiKeys = {};
                }
                req.session.apiKeys[provider] = {
                    encrypted: encryptedData.encrypted,
                    iv: encryptedData.iv,
                    tag: encryptedData.tag,
                    timestamp: Date.now(),
                };
                // Store baseUrl if provided
                if (baseUrl) {
                    if (!req.session.baseUrls) {
                        req.session.baseUrls = {};
                    }
                    req.session.baseUrls[provider] = baseUrl;
                }
                res.json({
                    success: true,
                    data: {
                        provider,
                        validated: true,
                        message: 'API key securely stored',
                    },
                });
            }
            catch (error) {
                console.error('Error saving API key:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to save API key',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Proxy endpoint for AI generation requests
     * @route POST /api/proxy/generate
     * @body { provider: string, model: string, prompt: string, parameters?: object, systemMessage?: string }
     */
    static proxyGenerate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { provider, model, prompt, parameters, systemMessage } = req.body;
                // Input validation
                if (!provider || !model || !prompt) {
                    res.status(400).json({
                        success: false,
                        error: 'Provider, model, and prompt are required',
                    });
                    return;
                }
                // Validate provider type
                const validProviders = ['google', 'openai', 'openrouter', 'anthropic'];
                if (!validProviders.includes(provider)) {
                    res.status(400).json({
                        success: false,
                        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
                    });
                    return;
                }
                // Sanitize inputs
                const sanitizedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
                if (!sanitizedPrompt) {
                    res.status(400).json({
                        success: false,
                        error: 'Prompt cannot be empty',
                    });
                    return;
                }
                // Retrieve and decrypt API key from session
                const apiKey = ProviderController.getApiKeyFromSession(req, provider);
                if (!apiKey) {
                    res.status(401).json({
                        success: false,
                        error: 'No valid API key found for this provider. Please configure your API key first.',
                    });
                    return;
                }
                // Get baseUrl from session if available
                const baseUrl = (_b = (_a = req.session) === null || _a === void 0 ? void 0 : _a.baseUrls) === null || _b === void 0 ? void 0 : _b[provider];
                // Create unified AI service instance
                const unifiedAI = unifiedAIService_1.UnifiedAIService.getInstance();
                // Make the AI request through the unified service
                const response = yield unifiedAI.testPrompt(sanitizedPrompt, {
                    provider,
                    model,
                    parameters: parameters || {},
                    apiKey,
                    baseUrl,
                });
                res.json({
                    success: true,
                    data: {
                        response,
                        provider,
                        model,
                    },
                });
            }
            catch (error) {
                console.error('Error in proxy generate:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate AI response',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Clear stored API keys from session
     * @route DELETE /api/providers/clear-keys
     */
    static clearApiKeys(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.session) {
                    delete req.session.apiKeys;
                    delete req.session.baseUrls;
                }
                res.json({
                    success: true,
                    data: {
                        message: 'API keys cleared from session',
                    },
                });
            }
            catch (error) {
                console.error('Error clearing API keys:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to clear API keys',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Get list of providers with stored keys (without exposing the keys)
     * @route GET /api/providers/stored-keys
     */
    static getStoredKeys(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const storedProviders = [];
                if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.apiKeys) {
                    for (const [provider, data] of Object.entries(req.session.apiKeys)) {
                        // Check if the stored key is not expired
                        if (Date.now() - data.timestamp < SESSION_TIMEOUT) {
                            storedProviders.push(provider);
                        }
                    }
                }
                res.json({
                    success: true,
                    data: {
                        providers: storedProviders,
                    },
                });
            }
            catch (error) {
                console.error('Error getting stored keys:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get stored keys',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    /**
     * Encrypt an API key for secure storage
     * @private
     */
    static encryptApiKey(apiKey) {
        try {
            const iv = crypto_1.default.randomBytes(16);
            const key = crypto_1.default.scryptSync(ENCRYPTION_KEY, 'salt', 32);
            const cipher = crypto_1.default.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
            let encrypted = cipher.update(apiKey, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag().toString('hex');
            return {
                encrypted,
                iv: iv.toString('hex'),
                tag,
            };
        }
        catch (error) {
            console.error('Failed to encrypt API key:', error);
            throw new Error('Failed to encrypt API key');
        }
    }
    /**
     * Decrypt an API key from secure storage
     * @private
     */
    static decryptApiKey(encryptedData) {
        try {
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const key = crypto_1.default.scryptSync(ENCRYPTION_KEY, 'salt', 32);
            const decipher = crypto_1.default.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
            if (encryptedData.tag) {
                const tag = Buffer.from(encryptedData.tag, 'hex');
                decipher.setAuthTag(tag);
            }
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            console.error('Failed to decrypt API key:', error);
            throw new Error('Failed to decrypt API key');
        }
    }
    /**
     * Get API key from session storage
     * @private
     */
    static getApiKeyFromSession(req, provider) {
        var _a;
        try {
            const apiKeys = (_a = req.session) === null || _a === void 0 ? void 0 : _a.apiKeys;
            if (!apiKeys || !apiKeys[provider]) {
                return null;
            }
            const keyData = apiKeys[provider];
            // Check if the key has expired
            if (Date.now() - keyData.timestamp > SESSION_TIMEOUT) {
                // Clean up expired key
                delete apiKeys[provider];
                return null;
            }
            return ProviderController.decryptApiKey(keyData);
        }
        catch (error) {
            console.error('Error retrieving API key from session:', error);
            return null;
        }
    }
}
exports.default = ProviderController;
