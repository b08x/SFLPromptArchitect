/**
 * @file providerController.ts
 * @description Controller for AI provider validation and status endpoints with secure key management
 * @since 0.6.0
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import {
  detectAvailableProviders,
  validateAllProviders,
  hasValidProvider,
  getPreferredProvider,
  validateProviderApiKey,
  type AIProvider as ValidatedAIProvider,
} from '../../services/providerValidationService';
import {
  testProviderConnection,
  getProviderInstance,
  getSupportedProviders,
  AIServiceError
} from '../../services/ai/aiSdkService';
import { UnifiedAIService } from '../../services/unifiedAIService';
import { AIProvider } from '../../types/aiProvider';
import { MODEL_CONFIG, getProviderConfig } from '../../config/model-config';

/**
 * Interface for session-stored API keys with encryption
 */
interface SecureApiKeyStorage {
  [provider: string]: {
    encrypted: string;
    iv: string;
    tag: string;
    timestamp: number;
  };
}

/**
 * Encryption configuration for API keys
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Controller class for managing AI provider validation and configuration
 */
class ProviderController {
  /**
   * Get the status of all available providers
   * @route GET /api/providers/status
   */
  static async getProviderStatus(req: Request, res: Response): Promise<void> {
    try {
      const providers = await validateAllProviders();
      const hasAnyValid = providers.some(p => p.validationResult?.success === true);
      const preferredProvider = await getPreferredProvider();

      res.json({
        success: true,
        data: {
          providers,
          hasValidProvider: hasAnyValid,
          preferredProvider,
        },
      });
    } catch (error) {
      console.error('Error checking provider status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check provider status',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get available providers without validation (faster)
   * @route GET /api/providers/available
   */
  static async getAvailableProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = detectAvailableProviders();

      res.json({
        success: true,
        data: {
          providers,
        },
      });
    } catch (error) {
      console.error('Error getting available providers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available providers',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get provider capabilities including models and configuration
   * @route GET /api/providers/capabilities
   */
  static async getProviderCapabilities(req: Request, res: Response): Promise<void> {
    try {
      const supportedProviders = getSupportedProviders();
      const providerCapabilities: Record<string, any> = {};

      // Build capabilities response for each supported provider
      for (const provider of supportedProviders) {
        const config = getProviderConfig(provider);
        
        if (config) {
          // Transform backend model config to frontend-compatible format
          const models = config.models.map(model => {
            // Build constraints dynamically from model's default parameters
            const constraints: Record<string, any> = {};
            
            // Always include temperature and maxTokens
            constraints.temperature = {
              min: 0.0,
              max: provider === 'cohere' ? 5.0 : (provider === 'groq' || provider === 'openai' ? 2.0 : 1.0),
              step: 0.1,
              default: model.defaultParameters.temperature || 0.7
            };
            
            constraints.maxTokens = {
              min: 1,
              max: model.capabilities.maxOutputTokens,
              step: 1,
              default: model.defaultParameters.maxTokens || 1024
            };
            
            // Add provider-specific parameters based on model's actual parameters
            if (model.defaultParameters.hasOwnProperty('top_p') || config.parameterMappings.top_p) {
              constraints.top_p = { min: 0.0, max: 1.0, step: 0.05, default: model.defaultParameters.top_p || 1.0 };
            }
            
            if (model.defaultParameters.hasOwnProperty('top_k') || config.parameterMappings.top_k) {
              constraints.top_k = { 
                min: 0, 
                max: provider === 'anthropic' ? 200 : 40, 
                step: 1, 
                default: model.defaultParameters.top_k || (provider === 'anthropic' ? 200 : 20)
              };
            }
            
            // OpenAI-specific parameters
            if (provider === 'openai') {
              if (model.defaultParameters.hasOwnProperty('presence_penalty')) {
                constraints.presence_penalty = { min: -2.0, max: 2.0, step: 0.1, default: model.defaultParameters.presence_penalty || 0.0 };
              }
              if (model.defaultParameters.hasOwnProperty('frequency_penalty')) {
                constraints.frequency_penalty = { min: -2.0, max: 2.0, step: 0.1, default: model.defaultParameters.frequency_penalty || 0.0 };
              }
            }
            
            // Cohere-specific parameters
            if (provider === 'cohere') {
              if (model.defaultParameters.hasOwnProperty('p')) {
                constraints.p = { min: 0.01, max: 0.99, step: 0.01, default: model.defaultParameters.p || 0.75 };
              }
              if (model.defaultParameters.hasOwnProperty('k')) {
                constraints.k = { min: 0, max: 500, step: 1, default: model.defaultParameters.k || 0 };
              }
            }
            
            // Groq/Mistral-specific parameters
            if (provider === 'groq' && model.defaultParameters.hasOwnProperty('seed')) {
              constraints.seed = { min: 0, max: 999999, step: 1, default: model.defaultParameters.seed || 0 };
            }
            
            return {
              id: model.id,
              name: model.name,
              provider,
              description: model.description,
              contextLength: model.capabilities.maxContextTokens,
              supportedParameters: Object.keys(constraints),
              constraints,
              pricing: {
                input: model.inputCostPer1K,
                output: model.outputCostPer1K,
              },
            };
          });

          providerCapabilities[provider] = {
            name: config.name,
            models,
            parameters: {
              // Standard parameters available across providers
              temperature: { 
                min: 0.0, 
                max: provider === 'cohere' ? 5.0 : (provider === 'groq' || provider === 'openai' ? 2.0 : 1.0), 
                step: 0.1, 
                default: 0.7 
              },
              maxTokens: { 
                min: 1, 
                max: Math.max(...models.map(m => m.constraints.maxTokens.max)), 
                step: 1, 
                default: 1024 
              },
              // Add provider-specific common parameters
              ...(config.supportedFeatures.includes('streaming') && {
                stream: { min: false, max: true, step: 1, default: false }
              })
            },
            features: config.supportedFeatures,
            baseUrl: config.baseUrl,
            requiresApiKey: config.requiresApiKey,
          };
        }
      }

      res.json({
        success: true,
        data: {
          providers: providerCapabilities,
        },
      });
    } catch (error) {
      console.error('Error getting provider capabilities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get provider capabilities',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if at least one provider is valid and ready
   * @route GET /api/providers/health
   */
  static async checkProviderHealth(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await hasValidProvider();
      const preferredProvider = await getPreferredProvider();

      res.json({
        success: true,
        data: {
          healthy: isHealthy,
          preferredProvider,
          requiresSetup: !isHealthy,
        },
      });
    } catch (error) {
      console.error('Error checking provider health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check provider health',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Validate a specific provider's API key
   * @route POST /api/providers/validate
   * @body { provider: string, apiKey: string, baseUrl?: string }
   */
  static async validateProvider(req: Request, res: Response): Promise<void> {
    try {
      const { provider, apiKey, baseUrl } = req.body;

      if (!provider || !apiKey) {
        res.status(400).json({
          success: false,
          error: 'Provider and API key are required',
        });
        return;
      }

      // Validate provider type using supported providers from aiSdkService
      const validProviders = getSupportedProviders();
      if (!validProviders.includes(provider as AIProvider)) {
        res.status(400).json({
          success: false,
          error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
        });
        return;
      }

      // Use aiSdkService to validate the provider by testing connection
      try {
        const isValid = await testProviderConnection(provider as AIProvider, apiKey, baseUrl);
        const result = {
          success: isValid,
          error: isValid ? undefined : 'API key validation failed'
        };
        
        // Additional validation using provider instance creation
        if (isValid) {
          try {
            getProviderInstance(provider as AIProvider, apiKey, baseUrl);
          } catch (error) {
            if (error instanceof AIServiceError) {
              res.json({
                success: true,
                data: {
                  provider,
                  validation: { success: false, error: error.message },
                },
              });
              return;
            }
            throw error;
          }
        }
        
        res.json({
          success: true,
          data: {
            provider,
            validation: result,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof AIServiceError 
          ? error.message 
          : 'Provider validation failed';
        
        res.json({
          success: true,
          data: {
            provider,
            validation: { success: false, error: errorMessage },
          },
        });
      }
    } catch (error) {
      console.error('Error validating provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate provider',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get the preferred provider based on configuration
   * @route GET /api/providers/preferred
   */
  static async getPreferredProvider(req: Request, res: Response): Promise<void> {
    try {
      const preferredProvider = await getPreferredProvider();

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
    } catch (error) {
      console.error('Error getting preferred provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get preferred provider',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Securely save an API key to the user's session
   * @route POST /api/providers/save-key
   * @body { provider: string, apiKey: string, baseUrl?: string }
   */
  static async saveApiKey(req: Request, res: Response): Promise<void> {
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

      // Validate provider type using supported providers from aiSdkService
      const validProviders = getSupportedProviders();
      if (!validProviders.includes(provider as AIProvider)) {
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

      // Validate the API key before storing using aiSdkService
      try {
        const isValid = await testProviderConnection(provider as AIProvider, sanitizedApiKey, baseUrl);
        if (!isValid) {
          res.status(400).json({
            success: false,
            error: 'Invalid API key: Provider validation failed',
          });
          return;
        }
        
        // Additional validation using provider instance creation
        getProviderInstance(provider as AIProvider, sanitizedApiKey, baseUrl);
      } catch (error) {
        const errorMessage = error instanceof AIServiceError 
          ? error.message 
          : 'API key validation failed';
        
        res.status(400).json({
          success: false,
          error: `Invalid API key: ${errorMessage}`,
        });
        return;
      }

      // Encrypt and store the API key in session
      const encryptedData = ProviderController.encryptApiKey(sanitizedApiKey);
      
      if (!req.session) {
        req.session = {} as typeof req.session;
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
    } catch (error) {
      console.error('Error saving API key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save API key',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Proxy endpoint for AI generation requests
   * @route POST /api/proxy/generate
   * @body { provider: string, model: string, prompt: string, parameters?: object, systemMessage?: string }
   */
  static async proxyGenerate(req: Request, res: Response): Promise<void> {
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

      // Validate provider type using supported providers from aiSdkService
      const validProviders = getSupportedProviders();
      if (!validProviders.includes(provider as AIProvider)) {
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
      const baseUrl = req.session?.baseUrls?.[provider];

      // Create unified AI service instance
      const unifiedAI = UnifiedAIService.getInstance();
      
      // Make the AI request through the unified service
      const response = await unifiedAI.testPrompt(sanitizedPrompt, {
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
    } catch (error) {
      console.error('Error in proxy generate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clear stored API keys from session
   * @route DELETE /api/providers/clear-keys
   */
  static async clearApiKeys(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error clearing API keys:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear API keys',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get list of providers with stored keys (without exposing the keys)
   * @route GET /api/providers/stored-keys
   */
  static async getStoredKeys(req: Request, res: Response): Promise<void> {
    try {
      const storedProviders: string[] = [];
      
      if (req.session?.apiKeys) {
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
    } catch (error) {
      console.error('Error getting stored keys:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stored keys',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Encrypt an API key for secure storage
   * @private
   */
  private static encryptApiKey(apiKey: string): { encrypted: string; iv: string; tag: string } {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
      
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag,
      };
    } catch (error) {
      console.error('Failed to encrypt API key:', error);
      throw new Error('Failed to encrypt API key');
    }
  }

  /**
   * Decrypt an API key from secure storage
   * @private
   */
  private static decryptApiKey(encryptedData: { encrypted: string; iv: string; tag?: string }): string {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
      
      if (encryptedData.tag) {
        const tag = Buffer.from(encryptedData.tag, 'hex');
        decipher.setAuthTag(tag);
      }
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      throw new Error('Failed to decrypt API key');
    }
  }

  /**
   * Get API key from session storage
   * @private
   */
  private static getApiKeyFromSession(req: Request, provider: string): string | null {
    try {
      const apiKeys = req.session?.apiKeys as SecureApiKeyStorage | undefined;
      
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
    } catch (error) {
      console.error('Error retrieving API key from session:', error);
      return null;
    }
  }
}

export default ProviderController;