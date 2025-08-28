/**
 * @file providerService.ts
 * @description Frontend service for AI provider validation and status management
 * @since 0.6.0
 */

import authService from './authService';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'ollama' | 'cohere' | 'mistral' | 'groq';

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

export interface ProviderStatusResponse {
  providers: ProviderAvailability[];
  hasValidProvider: boolean;
  preferredProvider: AIProvider | null;
}

export interface ProviderHealthResponse {
  healthy: boolean;
  preferredProvider: AIProvider | null;
  requiresSetup: boolean;
}

/**
 * Model information with capabilities and constraints
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  description?: string;
  contextLength: number;
  supportedParameters: string[];
  constraints: Record<string, { min: number; max: number; step: number; default: any }>;
  pricing?: {
    input: number; // per 1K tokens
    output: number; // per 1K tokens
  };
}

/**
 * Provider configuration with models and capabilities
 */
export interface ProviderConfig {
  provider: AIProvider;
  name: string;
  description: string;
  models: ModelInfo[];
  defaultParameters: Record<string, any>;
  supportedFeatures: string[];
  baseUrl?: string;
  requiresApiKey: boolean;
}

/**
 * Comprehensive provider data with availability and configuration
 */
export interface ProviderData extends ProviderAvailability {
  config?: ProviderConfig;
}

const API_BASE = '/api';

/**
 * Gets the status of all providers including validation results
 */
export async function getProviderStatus(): Promise<ProviderStatusResponse> {
  const response = await authService.authenticatedFetch(`${API_BASE}/providers/status`);
  
  if (!response.ok) {
    throw new Error(`Failed to get provider status: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown error getting provider status');
  }
  
  return data.data;
}

/**
 * Gets available providers without validation (faster)
 */
export async function getAvailableProviders(): Promise<{ providers: ProviderAvailability[] }> {
  const response = await authService.authenticatedFetch(`${API_BASE}/providers/available`);
  
  if (!response.ok) {
    throw new Error(`Failed to get available providers: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown error getting available providers');
  }
  
  return data.data;
}

/**
 * Gets comprehensive provider data including models and capabilities
 * This is the main function used by ProviderSwitcher for dynamic configuration
 */
export async function getProviderConfigurations(): Promise<ProviderData[]> {
  try {
    // Get availability data
    const availabilityResponse = await getAvailableProviders();
    const providers = availabilityResponse.providers;
    
    // Get stored providers to check which have valid keys
    const storedResponse = await getStoredProviders();
    const storedProviders = storedResponse.providers || [];
    
    // Get full provider capabilities from backend
    const capabilities = await getProviderCapabilities();
    
    // Map provider data with configurations
    const providerData: ProviderData[] = providers.map((provider) => {
      const hasStoredKey = storedProviders.includes(provider.provider);
      const config = capabilities[provider.provider];
      
      return {
        ...provider,
        hasApiKey: hasStoredKey,
        isConfigured: hasStoredKey,
        config: config, // Include the full provider configuration
      };
    });
    
    return providerData;
  } catch (error) {
    console.error('Error getting provider configurations:', error);
    throw error;
  }
}

/**
 * Gets provider capabilities from the backend API (replaces static configuration)
 */
export async function getProviderCapabilities(): Promise<Record<string, ProviderConfig>> {
  try {
    const response = await authService.authenticatedFetch(`${API_BASE}/providers/capabilities`);
    
    if (!response.ok) {
      throw new Error(`Failed to get provider capabilities: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error getting provider capabilities');
    }
    
    // Transform backend response to frontend format
    const capabilities: Record<string, ProviderConfig> = {};
    
    for (const [providerKey, providerData] of Object.entries(data.data.providers)) {
      const provider = providerKey as AIProvider;
      const config = providerData as any;
      
      capabilities[provider] = {
        provider,
        name: config.name,
        description: `AI provider: ${config.name}`,
        models: config.models,
        defaultParameters: config.models[0]?.constraints ? 
          Object.fromEntries(
            Object.entries(config.models[0].constraints).map(([key, constraint]: [string, any]) => 
              [key, constraint.default]
            )
          ) : {},
        supportedFeatures: config.features,
        baseUrl: config.baseUrl,
        requiresApiKey: config.requiresApiKey,
      };
    }
    
    return capabilities;
  } catch (error) {
    console.error('Error getting provider capabilities from backend:', error);
    throw new Error(`Failed to fetch provider capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets detailed configuration for a specific provider including models
 */
export async function getProviderConfiguration(provider: AIProvider): Promise<ProviderConfig> {
  try {
    // Use new dynamic capabilities endpoint
    const capabilities = await getProviderCapabilities();
    const config = capabilities[provider];
    
    if (!config) {
      throw new Error(`Provider ${provider} not found`);
    }
    
    return config;
  } catch (error) {
    console.error('Error getting provider configuration:', error);
    throw error;
  }
}

/**
 * Checks if at least one provider is healthy and ready
 */
export async function checkProviderHealth(): Promise<ProviderHealthResponse> {
  const response = await authService.authenticatedFetch(`${API_BASE}/providers/health`);
  
  if (!response.ok) {
    throw new Error(`Failed to check provider health: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown error checking provider health');
  }
  
  return data.data;
}

/**
 * Gets the preferred provider based on configuration
 */
export async function getPreferredProvider(): Promise<{ preferredProvider: AIProvider | null; requiresSetup: boolean }> {
  const response = await authService.authenticatedFetch(`${API_BASE}/providers/preferred`);
  
  const data = await response.json();
  
  if (!data.success) {
    if (response.status === 404) {
      // No valid provider available
      return {
        preferredProvider: null,
        requiresSetup: true,
      };
    }
    throw new Error(data.error || 'Unknown error getting preferred provider');
  }
  
  return data.data;
}

/**
 * Validates a specific provider's API key
 */
export async function validateProvider(
  provider: AIProvider,
  apiKey: string,
  baseUrl?: string
): Promise<{ provider: AIProvider; validation: ProviderValidationResult }> {
  const response = await authService.authenticatedFetch(`${API_BASE}/providers/validate`, {
    method: 'POST',
    body: JSON.stringify({
      provider,
      apiKey,
      baseUrl,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to validate provider: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown error validating provider');
  }
  
  return data.data;
}

/**
 * Securely save an API key to the backend
 */
export async function saveProviderApiKey(
  provider: AIProvider,
  apiKey: string,
  baseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authService.authenticatedFetch('/api/providers/save-key', {
      method: 'POST',
      credentials: 'include', // Include session cookies
      body: JSON.stringify({
        provider,
        apiKey,
        baseUrl,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.error || 'Unknown error saving API key' };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error saving API key',
    };
  }
}

/**
 * Validate a stored provider (check if key exists and is valid in session)
 */
export async function validateStoredProvider(provider: AIProvider): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authService.authenticatedFetch('/api/providers/stored-keys', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return { success: false, error: 'Failed to check stored providers' };
    }
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.error || 'Unknown error checking stored providers' };
    }
    
    return { success: data.data.providers.includes(provider) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error validating stored provider',
    };
  }
}

/**
 * Generate AI response through secure backend proxy
 */
export async function generateAIResponse(
  provider: AIProvider,
  model: string,
  prompt: string,
  parameters?: Record<string, unknown>,
  systemMessage?: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const response = await authService.authenticatedFetch('/api/proxy/generate', {
      method: 'POST',
      credentials: 'include', // Include session cookies
      body: JSON.stringify({
        provider,
        model,
        prompt,
        parameters,
        systemMessage,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.error || 'Unknown error generating AI response' };
    }
    
    return { success: true, response: data.data.response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error generating AI response',
    };
  }
}

/**
 * Clear all stored API keys from the backend session
 */
export async function clearStoredApiKeys(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authService.authenticatedFetch('/api/providers/clear-keys', {
      method: 'DELETE',
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.error || 'Unknown error clearing API keys' };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error clearing API keys',
    };
  }
}

/**
 * Get list of providers with stored API keys
 */
export async function getStoredProviders(): Promise<{ success: boolean; providers?: AIProvider[]; error?: string }> {
  try {
    const response = await authService.authenticatedFetch('/api/providers/stored-keys', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return { success: false, error: 'Failed to get stored providers' };
    }
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.error || 'Unknown error getting stored providers' };
    }
    
    return { success: true, providers: data.data.providers };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error getting stored providers',
    };
  }
}

/**
 * Validate parameters against model constraints
 */
export async function validateParameters(provider: AIProvider, modelId: string, parameters: any): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const config = await getProviderConfiguration(provider);
    const model = config.models.find(m => m.id === modelId);
    
    if (!model) {
      return { valid: false, errors: [`Model ${modelId} not found for provider ${provider}`] };
    }
    
    const constraints = model.constraints;
    const errors: string[] = [];

    Object.entries(parameters).forEach(([key, value]) => {
      const constraint = constraints[key as keyof typeof constraints];
      if (constraint && typeof value === 'number') {
        if (value < constraint.min || value > constraint.max) {
          errors.push(`${key} must be between ${constraint.min} and ${constraint.max}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('Error validating parameters:', error);
    return { valid: false, errors: ['Failed to validate parameters - provider configuration unavailable'] };
  }
}

/**
 * Checks if the application is ready (has at least one valid provider)
 * This is the main function used for routing logic
 */
export async function isApplicationReady(): Promise<boolean> {
  try {
    const health = await checkProviderHealth();
    return health.healthy;
  } catch (error) {
    console.error('Error checking application readiness:', error);
    return false;
  }
}

/**
 * Generate SFL prompt from goal using the unified AI service
 */
export async function generateSFLFromGoal(
  goal: string,
  sourceDocContent?: string,
  provider?: AIProvider,
  model?: string,
  parameters?: Record<string, unknown>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await authService.authenticatedFetch('/api/providers/generate-sfl', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        goal,
        sourceDocContent,
        provider,
        model,
        parameters,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.error || 'Failed to generate SFL prompt' };
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error generating SFL prompt',
    };
  }
}

/**
 * Regenerate SFL prompt from suggestion using the unified AI service
 */
export async function regenerateSFLFromSuggestion(
  currentPrompt: any,
  suggestion: string,
  provider?: AIProvider,
  model?: string,
  parameters?: Record<string, unknown>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await authService.authenticatedFetch('/api/providers/regenerate-sfl', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        currentPrompt,
        suggestion,
        provider,
        model,
        parameters,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.error || 'Failed to regenerate SFL prompt' };
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error regenerating SFL prompt',
    };
  }
}

/**
 * Generate workflow from goal using the unified AI service
 */
export async function generateWorkflowFromGoal(
  goal: string,
  provider?: AIProvider,
  model?: string,
  parameters?: Record<string, unknown>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await authService.authenticatedFetch('/api/providers/generate-workflow', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        goal,
        provider,
        model,
        parameters,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { success: false, error: data.error || 'Failed to generate workflow' };
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error generating workflow',
    };
  }
}