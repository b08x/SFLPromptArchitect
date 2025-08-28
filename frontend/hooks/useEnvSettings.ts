// frontend/hooks/useEnvSettings.ts
import { useEffect } from 'react';
import { ActiveProviderConfig, AIProvider } from '../types';

export const useEnvSettings = (
  setConfig: React.Dispatch<React.SetStateAction<ActiveProviderConfig | null>>,
  setStoredProviders: React.Dispatch<React.SetStateAction<AIProvider[]>>
) => {
  useEffect(() => {
    const checkEnv = async () => {
      // This is a placeholder for how you might check server-side env vars
      // In a real app, this might be an API call on startup
      const response = await fetch('/api/providers/env-check');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.configuredProvider) {
          const provider = data.data.configuredProvider as AIProvider;
          setStoredProviders(prev => [...new Set([...prev, provider])]);
          
          // Optionally, set this as the active provider
          // For now, we'll just mark it as configured.
          // The main App component will decide which provider is active.
        }
      }
    };

    // We can't directly access process.env in the browser,
    // so this hook is conceptual. A real implementation would
    // require an API endpoint to expose which providers are configured
    // on the backend via environment variables.
    // checkEnv();
  }, [setConfig, setStoredProviders]);
};
