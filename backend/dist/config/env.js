"use strict";
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
const dotenv_1 = __importDefault(require("dotenv"));
const secrets_1 = __importDefault(require("./secrets"));
// Load environment variables from .env file
dotenv_1.default.config();
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
exports.default = {
    // Async methods for secure secrets
    getDatabaseUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getDatabaseUrl();
        });
    },
    getRedisUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getRedisUrl();
        });
    },
    getGeminiApiKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getProviderApiKey('google');
        });
    },
    getOpenaiApiKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getProviderApiKey('openai');
        });
    },
    getOpenrouterApiKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getProviderApiKey('openrouter');
        });
    },
    getAnthropicApiKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getProviderApiKey('anthropic');
        });
    },
    getJWTSecret() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getJWTSecret();
        });
    },
    getSessionSecret() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getSessionSecret();
        });
    },
    getProviderApiKey(provider) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield secrets_1.default.getProviderApiKey(provider);
        });
    },
    // Non-sensitive configuration (immediate access)
    defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || 'google',
    fallbackAiProvider: process.env.FALLBACK_AI_PROVIDER || 'openai',
    openaiDefaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
    googleDefaultModel: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-2.5-flash',
    openrouterDefaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4',
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    anthropicDefaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet',
    enableGrounding: process.env.ENABLE_GROUNDING === 'true',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 4000,
    // Health check method
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const health = yield secrets_1.default.healthCheck();
                return {
                    secrets: true,
                    vault: health.vault,
                    fallback: health.fallback
                };
            }
            catch (error) {
                console.error('Config health check failed:', error);
                return {
                    secrets: false,
                    vault: false,
                    fallback: true
                };
            }
        });
    }
};
