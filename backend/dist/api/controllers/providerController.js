"use strict";
/**
 * @file providerController.ts
 * @description Controller for AI provider validation and status endpoints
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
Object.defineProperty(exports, "__esModule", { value: true });
const providerValidationService_1 = require("../../services/providerValidationService");
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
}
exports.default = ProviderController;
