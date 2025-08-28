/**
 * @file providerValidationService.ts
 * @description Service for validating AI provider API keys and detecting available providers from environment variables
 * @since 0.6.0
 */

import { Request } from 'express';
import config from '../config/env';

export type AIProvider = 'google' | 'openai' | 'openrouter' | 'anthropic' | 'ollama' | 'cohere' | 'mistral' | 'groq';

export interface ProviderConfig {
  apiKey: string;
  defaultModel: string;
  baseUrl?: string;
}

export interface ProviderValidationResult {
  success: boolean;
  error?: string;
}

export interface ProviderAvailability {
  provider: AIProvider;
  hasApiKey: boolean;
  isConfigured: boolean;
  validationResult?: ProviderValidationResult;
}

/**
 * Detects which AI providers are configured via environment variables
 * @returns Promise resolving to array of provider availability information
 */
export async function detectAvailableProviders(): Promise<ProviderAvailability[]> {
  const [
    geminiApiKey, 
    openaiApiKey, 
    openrouterApiKey, 
    anthropicApiKey,
    ollamaApiKey,
    cohereApiKey,
    mistralApiKey,
    groqApiKey
  ] = await Promise.all([
    config.getGeminiApiKey().catch(() => ''),
    config.getOpenaiApiKey().catch(() => ''),
    config.getOpenrouterApiKey().catch(() => ''),
    config.getAnthropicApiKey().catch(() => ''),
    config.getOllamaApiKey().catch(() => ''),
    config.getCohereApiKey().catch(() => ''),
    config.getMistralApiKey().catch(() => ''),
    config.getGroqApiKey().catch(() => '')
  ]);

  const providers: ProviderAvailability[] = [
    {
      provider: 'google',
      hasApiKey: !!geminiApiKey,
      isConfigured: !!(geminiApiKey && config.googleDefaultModel),
    },
    {
      provider: 'openai',
      hasApiKey: !!openaiApiKey,
      isConfigured: !!(openaiApiKey && config.openaiDefaultModel),
    },
    {
      provider: 'openrouter',
      hasApiKey: !!openrouterApiKey,
      isConfigured: !!(openrouterApiKey && config.openrouterDefaultModel && config.openrouterBaseUrl),
    },
    {
      provider: 'anthropic',
      hasApiKey: !!anthropicApiKey,
      isConfigured: !!(anthropicApiKey && config.anthropicDefaultModel),
    },
    {
      provider: 'ollama',
      hasApiKey: !!ollamaApiKey || true, // Ollama can work without API key for local instances
      isConfigured: !!(config.ollamaDefaultModel), // Only need default model
    },
    {
      provider: 'cohere',
      hasApiKey: !!cohereApiKey,
      isConfigured: !!(cohereApiKey && config.cohereDefaultModel),
    },
    {
      provider: 'mistral',
      hasApiKey: !!mistralApiKey,
      isConfigured: !!(mistralApiKey && config.mistralDefaultModel),
    },
    {
      provider: 'groq',
      hasApiKey: !!groqApiKey,
      isConfigured: !!(groqApiKey && config.groqDefaultModel),
    },
  ];

  return providers;
}

/**
 * Gets the configured provider settings
 * @param provider The AI provider
 * @returns Promise resolving to provider configuration or null if not configured
 */
export async function getProviderConfig(provider: AIProvider): Promise<ProviderConfig | null> {
  try {
    switch (provider) {
      case 'google': {
        const apiKey = await config.getGeminiApiKey();
        if (!apiKey) return null;
        return {
          apiKey,
          defaultModel: config.googleDefaultModel,
        };
      }

      case 'openai': {
        const apiKey = await config.getOpenaiApiKey();
        if (!apiKey) return null;
        return {
          apiKey,
          defaultModel: config.openaiDefaultModel,
        };
      }

      case 'openrouter': {
        const apiKey = await config.getOpenrouterApiKey();
        if (!apiKey) return null;
        return {
          apiKey,
          defaultModel: config.openrouterDefaultModel,
          baseUrl: config.openrouterBaseUrl,
        };
      }

      case 'anthropic': {
        const apiKey = await config.getAnthropicApiKey();
        if (!apiKey) return null;
        return {
          apiKey,
          defaultModel: config.anthropicDefaultModel,
        };
      }

      case 'ollama': {
        const apiKey = await config.getOllamaApiKey().catch(() => 'local');
        return {
          apiKey: apiKey || 'local', // Ollama can work with local mode
          defaultModel: config.ollamaDefaultModel,
          baseUrl: 'http://localhost:11434',
        };
      }

      case 'cohere': {
        const apiKey = await config.getCohereApiKey();
        if (!apiKey) return null;
        return {
          apiKey,
          defaultModel: config.cohereDefaultModel,
        };
      }

      case 'mistral': {
        const apiKey = await config.getMistralApiKey();
        if (!apiKey) return null;
        return {
          apiKey,
          defaultModel: config.mistralDefaultModel,
        };
      }

      case 'groq': {
        const apiKey = await config.getGroqApiKey();
        if (!apiKey) return null;
        return {
          apiKey,
          defaultModel: config.groqDefaultModel,
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to get provider config for ${provider}:`, error);
    return null;
  }
}

/**
 * Validates an API key by making a request to the provider's API
 * @param provider The AI provider
 * @param apiKey The API key to validate
 * @param baseUrl Optional base URL for OpenRouter/custom providers
 * @returns Promise resolving to validation result
 */
export async function validateProviderApiKey(
  provider: AIProvider,
  apiKey: string,
  baseUrl?: string
): Promise<ProviderValidationResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, error: 'API key cannot be empty' };
  }

  try {
    switch (provider) {
      case 'google': {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            return { success: false, error: 'Invalid Google API key' };
          } else if (response.status === 403) {
            return { success: false, error: 'Google API key does not have permission to access Generative AI models' };
          } else if (response.status === 429) {
            return { success: false, error: 'Rate limit exceeded for Google API' };
          } else {
            return { success: false, error: `Google API error: ${response.status} ${response.statusText}` };
          }
        }

        return { success: true };
      }

      case 'openai': {
        const url = baseUrl || 'https://api.openai.com';
        const response = await fetch(`${url}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            return { success: false, error: 'Invalid OpenAI API key' };
          } else if (response.status === 403) {
            return { success: false, error: 'OpenAI API key does not have permission to access models' };
          } else if (response.status === 429) {
            return { success: false, error: 'Rate limit exceeded for OpenAI API' };
          } else {
            return { success: false, error: `OpenAI API error: ${response.status} ${response.statusText}` };
          }
        }

        return { success: true };
      }

      case 'openrouter': {
        const url = baseUrl || config.openrouterBaseUrl;
        const response = await fetch(`${url}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            return { success: false, error: 'Invalid OpenRouter API key' };
          } else if (response.status === 403) {
            return { success: false, error: 'OpenRouter API key does not have permission to access models' };
          } else if (response.status === 429) {
            return { success: false, error: 'Rate limit exceeded for OpenRouter API' };
          } else {
            return { success: false, error: `OpenRouter API error: ${response.status} ${response.statusText}` };
          }
        }

        return { success: true };
      }

      case 'anthropic': {
        // Note: Anthropic doesn't have a simple models endpoint like others
        // We'll do a minimal completion request to validate the key
        const response = await fetch('https://api.anthropic.com/v1/messages', {
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
          } else if (response.status === 403) {
            return { success: false, error: 'Anthropic API key does not have permission to access Claude' };
          } else if (response.status === 429) {
            return { success: false, error: 'Rate limit exceeded for Anthropic API' };
          } else {
            return { success: false, error: `Anthropic API error: ${response.status} ${response.statusText}` };
          }
        }

        return { success: true };
      }

      default:
        return { success: false, error: `Unsupported provider: ${provider}` };
    }
  } catch (error) {
    return {
      success: false,
      error: `Network error validating ${provider} API key: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validates all configured providers
 * @returns Promise resolving to array of provider availability with validation results
 */
export async function validateAllProviders(): Promise<ProviderAvailability[]> {
  const providers = await detectAvailableProviders();
  
  const validationPromises = providers.map(async (provider) => {
    if (!provider.hasApiKey) {
      return { ...provider, validationResult: { success: false, error: 'No API key configured' } };
    }

    const providerConfig = await getProviderConfig(provider.provider);
    if (!providerConfig) {
      return { ...provider, validationResult: { success: false, error: 'Provider not configured' } };
    }

    const validationResult = await validateProviderApiKey(
      provider.provider,
      providerConfig.apiKey,
      providerConfig.baseUrl
    );

    return { ...provider, validationResult };
  });

  return await Promise.all(validationPromises);
}

/**
 * Checks if at least one provider is valid and configured
 * @returns Promise resolving to boolean indicating if any provider is available
 */
export async function hasValidProvider(): Promise<boolean> {
  const results = await validateAllProviders();
  return results.some(result => result.validationResult?.success === true);
}

/**
 * Gets the preferred provider based on configuration and availability
 * @returns Promise resolving to the preferred provider or null if none available
 */
export async function getPreferredProvider(req: Request): Promise<AIProvider | null> {
  const results = await validateAllProviders();

  // 1. Check for a user-specific preferred provider in the session
  if (req.session?.preferredProvider) {
    const sessionProvider = results.find(r => r.provider === req.session.preferredProvider);
    if (sessionProvider?.validationResult?.success) {
      return sessionProvider.provider;
    }
  }
  
  // 2. First try the default provider
  const defaultProvider = results.find(r => r.provider === config.defaultAiProvider);
  if (defaultProvider?.validationResult?.success) {
    return defaultProvider.provider;
  }

  // 3. Then try the fallback provider
  const fallbackProvider = results.find(r => r.provider === config.fallbackAiProvider);
  if (fallbackProvider?.validationResult?.success) {
    return fallbackProvider.provider;
  }

  // 4. Finally, return the first valid provider
  const validProvider = results.find(r => r.validationResult?.success);
  return validProvider?.provider || null;
}