/**
 * @file health.ts
 * @description Health check endpoints that include secrets management status
 * and system connectivity verification. Provides comprehensive status information
 * for monitoring and operational visibility.
 * 
 * @since 0.6.0
 */

import express, { Request, Response } from 'express';
import config from '../config/env';

const router = express.Router();

/**
 * Basic health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'sfl-prompt-studio-backend',
            version: process.env.npm_package_version || '0.6.0'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Internal server error'
        });
    }
});

/**
 * Detailed health check including secrets management
 */
router.get('/detailed', async (req: Request, res: Response) => {
    try {
        const startTime = Date.now();
        
        // Check secrets management system
        const secretsHealth = await config.healthCheck();
        
        // Check database connectivity (if needed)
        let database: { status: string; error?: string } = { status: 'unknown' };
        try {
            const dbUrl = await config.getDatabaseUrl();
            if (dbUrl) {
                database = { status: 'configured' };
            }
        } catch (error) {
            database = { 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
        
        // Check Redis connectivity (if needed)
        let redis: { status: string; error?: string } = { status: 'unknown' };
        try {
            const redisUrl = await config.getRedisUrl();
            if (redisUrl) {
                redis = { status: 'configured' };
            }
        } catch (error) {
            redis = { 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
        
        // Check AI provider configuration
        const providers: Record<string, any> = {};
        const supportedProviders = ['google', 'openai', 'anthropic', 'openrouter'];
        
        for (const provider of supportedProviders) {
            try {
                const apiKey = await config.getProviderApiKey(provider);
                providers[provider] = {
                    status: apiKey ? 'configured' : 'missing',
                    hasKey: !!apiKey
                };
            } catch (error) {
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
            environment: config.nodeEnv,
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
        
    } catch (error) {
        console.error('Detailed health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check system error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * Secrets management specific health check
 */
router.get('/secrets', async (req: Request, res: Response) => {
    try {
        const secretsHealth = await config.healthCheck();
        
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
        
    } catch (error) {
        console.error('Secrets health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Secrets management system error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;