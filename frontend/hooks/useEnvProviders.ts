/**
 * @file useEnvProviders.ts
 * @description Hook for environment variable provider fallbacks following ARIA pattern
 * Simple environment detection without complex state management
 */

import { useState, useEffect } from 'react';
import { AIProvider } from '../types/aiProvider';

export interface EnvProvider {
  provider: AIProvider;
  configured: boolean;
}

/**
 * Simple hook to check which providers are available via environment variables
 * This follows the ARIA pattern of checking env vars first before requiring user input
 */
export function useEnvProviders() {
  const [envProviders, setEnvProviders] = useState<EnvProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkEnvProviders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/providers/env-check', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to check environment providers: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Unknown error checking environment providers');
        }

        // Transform response into our format
        const providers: EnvProvider[] = Object.entries(data.data.providers).map(([provider, configured]) => ({
          provider: provider as AIProvider,
          configured: configured as boolean,
        }));

        setEnvProviders(providers);

      } catch (err) {
        console.error('Error checking environment providers:', err);
        setError(err instanceof Error ? err.message : 'Failed to check environment providers');
      } finally {
        setIsLoading(false);
      }
    };

    checkEnvProviders();
  }, []);

  return {
    envProviders,
    isLoading,
    error,
  };
}

/**
 * Get the first available provider from environment variables
 * Returns null if no providers are configured via environment
 */
export function useFirstAvailableEnvProvider(): AIProvider | null {
  const { envProviders, isLoading } = useEnvProviders();
  
  if (isLoading || envProviders.length === 0) {
    return null;
  }

  const firstConfigured = envProviders.find(p => p.configured);
  return firstConfigured?.provider || null;
}