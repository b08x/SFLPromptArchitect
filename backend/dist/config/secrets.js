"use strict";
/**
 * @file secrets.ts
 * @description Secure secrets management service that integrates with HashiCorp Vault
 * while providing graceful fallback to environment variables for development.
 *
 * Features:
 * - Runtime secret retrieval from Vault
 * - Automatic token renewal and authentication
 * - Development mode fallback to environment variables
 * - Connection pooling and retry logic
 * - Comprehensive error handling and logging
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
exports.SecretsManager = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Secrets manager service for secure runtime secret retrieval
 */
class SecretsManager {
    constructor() {
        this.cache = new Map();
        this.isVaultEnabled = false;
        this.vaultToken = null;
        this.tokenExpiresAt = 0;
        this.config = this.loadVaultConfig();
        this.vault = this.createVaultClient();
        // Initialize Vault asynchronously to avoid blocking startup
        this.initializeVault().catch(error => {
            console.error('Vault initialization failed:', error);
            // Don't throw - continue with environment variable fallback
        });
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!SecretsManager.instance) {
            SecretsManager.instance = new SecretsManager();
        }
        return SecretsManager.instance;
    }
    /**
     * Load Vault configuration from environment
     */
    loadVaultConfig() {
        return {
            url: process.env.VAULT_ADDR || 'http://vault:8200',
            token: process.env.VAULT_TOKEN,
            roleId: process.env.VAULT_ROLE_ID,
            secretId: process.env.VAULT_SECRET_ID,
            mountPath: process.env.VAULT_MOUNT_PATH || 'secret',
            timeout: parseInt(process.env.VAULT_TIMEOUT || '5000'),
            tlsVerify: process.env.VAULT_TLS_VERIFY !== 'false'
        };
    }
    /**
     * Create configured Vault HTTP client
     */
    createVaultClient() {
        return axios_1.default.create(Object.assign({ baseURL: this.config.url, timeout: this.config.timeout, headers: {
                'Content-Type': 'application/json'
            } }, (process.env.NODE_ENV === 'development' && {
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: this.config.tlsVerify
            })
        })));
    }
    /**
     * Initialize Vault connection and authentication
     */
    initializeVault() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if Vault credentials are provided
                const hasVaultConfig = this.config.token || (this.config.roleId && this.config.secretId);
                if (!hasVaultConfig) {
                    console.log('🔧 No Vault configuration found. Using environment variables for secrets');
                    return;
                }
                // Authenticate with Vault
                if (this.config.token) {
                    yield this.authenticateWithToken();
                }
                else if (this.config.roleId && this.config.secretId) {
                    yield this.authenticateWithAppRole();
                }
                this.isVaultEnabled = true;
                console.log('🔒 Vault connection established successfully');
            }
            catch (error) {
                console.error('❌ Failed to initialize Vault:', error);
                console.log('⚠️  Falling back to environment variables for secrets');
                // Always allow fallback - don't fail in production if env vars are available
                this.isVaultEnabled = false;
            }
        });
    }
    /**
     * Authenticate using Vault token
     */
    authenticateWithToken() {
        return __awaiter(this, void 0, void 0, function* () {
            this.vaultToken = this.config.token;
            this.vault.defaults.headers['X-Vault-Token'] = this.vaultToken;
            // Verify token is valid
            const response = yield this.vault.get('/v1/auth/token/lookup-self');
            const tokenData = response.data.data;
            this.tokenExpiresAt = tokenData.expire_time ?
                new Date(tokenData.expire_time).getTime() :
                Date.now() + (24 * 60 * 60 * 1000); // Default 24h if no expiry
        });
    }
    /**
     * Authenticate using AppRole method
     */
    authenticateWithAppRole() {
        return __awaiter(this, void 0, void 0, function* () {
            const authResponse = yield this.vault.post('/v1/auth/approle/login', {
                role_id: this.config.roleId,
                secret_id: this.config.secretId
            });
            const authData = authResponse.data.auth;
            this.vaultToken = authData.client_token;
            this.tokenExpiresAt = Date.now() + (authData.lease_duration * 1000);
            this.vault.defaults.headers['X-Vault-Token'] = this.vaultToken;
        });
    }
    /**
     * Renew Vault token if needed
     */
    renewTokenIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.vaultToken || Date.now() >= this.tokenExpiresAt - 300000) { // Renew 5min before expiry
                if (this.config.roleId && this.config.secretId) {
                    yield this.authenticateWithAppRole();
                }
                else {
                    console.warn('⚠️  Token expiring but no AppRole configured for renewal');
                }
            }
        });
    }
    /**
     * Get secret value with caching and fallback
     */
    getSecret(secretPath, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `${secretPath}:${key}`;
            // Check cache first
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() < cached.expiresAt) {
                return cached.value;
            }
            let secretValue;
            if (this.isVaultEnabled) {
                try {
                    secretValue = yield this.getSecretFromVault(secretPath, key);
                }
                catch (error) {
                    console.error(`❌ Failed to get secret from Vault: ${secretPath}:${key}`, error);
                    console.log(`⚠️  Falling back to environment variables for: ${key}`);
                    // Always try environment variables as fallback
                    secretValue = this.getSecretFromEnv(key);
                }
            }
            else {
                secretValue = this.getSecretFromEnv(key);
            }
            if (!secretValue) {
                throw new Error(`Secret not found: ${secretPath}:${key}`);
            }
            // Cache for 5 minutes
            this.cache.set(cacheKey, {
                value: secretValue,
                expiresAt: Date.now() + 300000
            });
            return secretValue;
        });
    }
    /**
     * Retrieve secret from Vault
     */
    getSecretFromVault(secretPath, key) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield this.renewTokenIfNeeded();
            const fullPath = `/v1/${this.config.mountPath}/data/${secretPath}`;
            const response = yield this.vault.get(fullPath);
            const secretData = (_a = response.data.data) === null || _a === void 0 ? void 0 : _a.data;
            if (!secretData || !secretData[key]) {
                throw new Error(`Key '${key}' not found in secret '${secretPath}'`);
            }
            return secretData[key];
        });
    }
    /**
     * Fallback to environment variables
     */
    getSecretFromEnv(key) {
        // Map common secret keys to environment variable names
        const envKeyMap = {
            'gemini_api_key': 'GEMINI_API_KEY',
            'google_ai_api_key': 'GEMINI_API_KEY', // Map to actual env var
            'openai_api_key': 'OPENAI_API_KEY',
            'anthropic_api_key': 'ANTHROPIC_API_KEY',
            'openrouter_api_key': 'OPENROUTER_API_KEY',
            'database_url': 'DATABASE_URL',
            'redis_url': 'REDIS_URL',
            'jwt_secret': 'JWT_SECRET',
            'session_secret': 'SESSION_SECRET'
        };
        const envKey = envKeyMap[key.toLowerCase()] || key.toUpperCase();
        const value = process.env[envKey] || '';
        // For debugging - show what's being looked up
        if (!value && key !== 'jwt_secret' && key !== 'session_secret') {
            console.log(`🔍 Looking for env var: ${envKey} (key: ${key}) - found: ${!!value}`);
        }
        return value;
    }
    /**
     * Get API provider secrets with caching
     */
    getProviderApiKey(provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyMap = {
                'google': 'google_ai_api_key',
                'openai': 'openai_api_key',
                'anthropic': 'anthropic_api_key',
                'openrouter': 'openrouter_api_key'
            };
            const secretKey = keyMap[provider];
            if (!secretKey) {
                throw new Error(`Unknown AI provider: ${provider}`);
            }
            return this.getSecret('ai-providers', secretKey);
        });
    }
    /**
     * Get database connection string
     */
    getDatabaseUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getSecret('database', 'database_url');
        });
    }
    /**
     * Get Redis connection string
     */
    getRedisUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getSecret('database', 'redis_url');
        });
    }
    /**
     * Get JWT signing secret
     */
    getJWTSecret() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getSecret('auth', 'jwt_secret');
        });
    }
    /**
     * Get session secret
     */
    getSessionSecret() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getSecret('auth', 'session_secret');
        });
    }
    /**
     * Clear all cached secrets
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Check if Vault is available and healthy
     */
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            let vaultHealthy = false;
            if (this.isVaultEnabled) {
                try {
                    yield this.vault.get('/v1/sys/health');
                    vaultHealthy = true;
                }
                catch (error) {
                    console.error('Vault health check failed:', error);
                }
            }
            return {
                vault: vaultHealthy,
                fallback: !this.isVaultEnabled || !vaultHealthy
            };
        });
    }
}
exports.SecretsManager = SecretsManager;
// Export singleton instance
exports.default = SecretsManager.getInstance();
