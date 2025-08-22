/**
 * @file providerService.ts
 * @description Frontend service for AI provider validation and status management
 * @since 0.6.0
 */

export type AIProvider = 'google' | 'openai' | 'openrouter' | 'anthropic';

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

const API_BASE = '/api';

/**
 * Gets the status of all providers including validation results
 */
export async function getProviderStatus(): Promise<ProviderStatusResponse> {
  const response = await fetch(`${API_BASE}/providers/status`);
  
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
  const response = await fetch(`${API_BASE}/providers/available`);
  
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
 * Checks if at least one provider is healthy and ready
 */
export async function checkProviderHealth(): Promise<ProviderHealthResponse> {
  const response = await fetch(`${API_BASE}/providers/health`);
  
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
  const response = await fetch(`${API_BASE}/providers/preferred`);
  
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
  const response = await fetch(`${API_BASE}/providers/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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