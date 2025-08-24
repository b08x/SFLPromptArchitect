"use strict";
/**
 * @file health.ts
 * @description Health check endpoints that include secrets management status
 * and system connectivity verification. Provides comprehensive status information
 * for monitoring and operational visibility.
 *
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
const express_1 = __importDefault(require("express"));
const env_1 = __importDefault(require("../config/env"));
const router = express_1.default.Router();
/**
 * Basic health check endpoint
 */
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'sfl-prompt-studio-backend',
            version: process.env.npm_package_version || '0.6.0'
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Internal server error'
        });
    }
}));
/**
 * Detailed health check including secrets management
 */
router.get('/detailed', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startTime = Date.now();
        // Check secrets management system
        const secretsHealth = yield env_1.default.healthCheck();
        // Check database connectivity (if needed)
        let database = { status: 'unknown' };
        try {
            const dbUrl = yield env_1.default.getDatabaseUrl();
            if (dbUrl) {
                database = { status: 'configured' };
            }
        }
        catch (error) {
            database = {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        // Check Redis connectivity (if needed)
        let redis = { status: 'unknown' };
        try {
            const redisUrl = yield env_1.default.getRedisUrl();
            if (redisUrl) {
                redis = { status: 'configured' };
            }
        }
        catch (error) {
            redis = {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        // Check AI provider configuration
        const providers = {};
        const supportedProviders = ['google', 'openai', 'anthropic', 'openrouter'];
        for (const provider of supportedProviders) {
            try {
                const apiKey = yield env_1.default.getProviderApiKey(provider);
                providers[provider] = {
                    status: apiKey ? 'configured' : 'missing',
                    hasKey: !!apiKey
                };
            }
            catch (error) {
                providers[provider] = {
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }
        const responseTime = Date.now() - startTime;
        const overallStatus = secretsHealth.secrets &&
            database.status !== 'error' &&
            redis.status !== 'error' ? 'healthy' : 'degraded';
        res.status(overallStatus === 'healthy' ? 200 : 503).json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            service: 'sfl-prompt-studio-backend',
            version: process.env.npm_package_version || '0.6.0',
            environment: env_1.default.nodeEnv,
            components: {
                secrets: {
                    status: secretsHealth.secrets ? 'healthy' : 'degraded',
                    vault: {
                        enabled: secretsHealth.vault,
                        fallback: secretsHealth.fallback
                    }
                },
                database,
                redis,
                aiProviders: providers
            }
        });
    }
    catch (error) {
        console.error('Detailed health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check system error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
/**
 * Secrets management specific health check
 */
router.get('/secrets', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const secretsHealth = yield env_1.default.healthCheck();
        res.status(secretsHealth.secrets ? 200 : 503).json({
            status: secretsHealth.secrets ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            vault: {
                available: secretsHealth.vault,
                fallbackMode: secretsHealth.fallback
            },
            message: secretsHealth.vault
                ? 'Using HashiCorp Vault for secrets management'
                : 'Using fallback environment variables for secrets'
        });
    }
    catch (error) {
        console.error('Secrets health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Secrets management system error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
exports.default = router;
