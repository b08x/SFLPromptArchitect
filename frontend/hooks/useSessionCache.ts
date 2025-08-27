/**
 * @file useSessionCache.ts
 * @description React hook for managing session cache integration with provider configuration.
 * This hook provides a convenient interface for React components to interact with the
 * session cache service and stay updated on cache state changes.
 *
 * @requires react
 * @requires ../services/sessionCacheService
 * @requires ../services/providerConfigService
 */

import { useState, useEffect, useCallback } from 'react';
import { sessionCacheService, SessionSettings } from '../services/sessionCacheService';
import { providerConfigService } from '../services/providerConfigService';
import type { AIProvider, ModelParameters } from '../types/aiProvider';

/**
 * Hook state interface for session cache management
 */
interface SessionCacheState {
  /** Whether session storage is supported by the browser */
  isSupported: boolean;
  /** Whether there are cached settings available */
  hasCachedData: boolean;
  /** Age of cached data in milliseconds */
  cacheAge?: number;
  /** Cache version information */
  version?: string;
  /** Whether a cache operation is in progress */
  isLoading: boolean;
  /** Last error that occurred during cache operations */
  lastError: string | null;
}

/**
 * Return type for the useSessionCache hook
 */
interface UseSessionCacheReturn extends SessionCacheState {
  /** Load settings from session cache if available */
  loadFromCache: () => Promise<boolean>;
  /** Save current provider settings to cache */
  saveToCache: () => Promise<boolean>;
  /** Clear all cached data */
  clearCache: () => Promise<boolean>;
  /** Refresh cache state information */
  refreshCacheInfo: () => void;
  /** Get cached settings without loading them into provider config */
  getCachedSettings: () => Promise<SessionSettings | null>;
}

/**
 * Custom hook for managing session cache operations in React components
 * 
 * @example
 * ```tsx
 * function ProviderSettings() {
 *   const {
 *     isSupported,
 *     hasCachedData,
 *     cacheAge,
 *     loadFromCache,
 *     saveToCache,
 *     clearCache,
 *     isLoading,
 *     lastError
 *   } = useSessionCache();
 * 
 *   return (
 *     <div>
 *       {isSupported && (
 *         <div>
 *           <p>Cache Age: {cacheAge ? `${Math.round(cacheAge / 1000)}s` : 'N/A'}</p>
 *           <button onClick={loadFromCache} disabled={!hasCachedData || isLoading}>
 *             Load from Cache
 *           </button>
 *           <button onClick={saveToCache} disabled={isLoading}>
 *             Save to Cache
 *           </button>
 *           <button onClick={clearCache} disabled={isLoading}>
 *             Clear Cache
 *           </button>
 *         </div>
 *       )}
 *       {lastError && <div className="error">Error: {lastError}</div>}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns Hook state and methods for session cache management
 */
export function useSessionCache(): UseSessionCacheReturn {
  const [state, setState] = useState<SessionCacheState>({
    isSupported: false,
    hasCachedData: false,
    isLoading: false,
    lastError: null
  });

  /**
   * Updates the cache state information
   */
  const updateCacheInfo = useCallback(() => {
    const cacheInfo = sessionCacheService.getCacheInfo();
    setState(prevState => ({
      ...prevState,
      isSupported: cacheInfo.isSupported,
      hasCachedData: cacheInfo.hasCachedData,
      cacheAge: cacheInfo.cacheAge,
      version: cacheInfo.version
    }));
  }, []);

  /**
   * Sets loading state and clears previous errors
   */
  const setLoading = useCallback((loading: boolean) => {
    setState(prevState => ({
      ...prevState,
      isLoading: loading,
      lastError: loading ? null : prevState.lastError
    }));
  }, []);

  /**
   * Sets error state and clears loading
   */
  const setError = useCallback((error: string) => {
    setState(prevState => ({
      ...prevState,
      isLoading: false,
      lastError: error
    }));
  }, []);

  /**
   * Loads settings from session cache and applies them to provider config
   */
  const loadFromCache = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    
    try {
      const success = providerConfigService.loadFromSessionCache();
      
      if (success) {
        updateCacheInfo();
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          lastError: null
        }));
        return true;
      } else {
        updateCacheInfo();
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          lastError: null // No error, just no cache available
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load from cache: ${errorMessage}`);
      return false;
    }
  }, [setLoading, setError, updateCacheInfo]);

  /**
   * Saves current provider settings to session cache
   */
  const saveToCache = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    
    try {
      const currentConfig = providerConfigService.getCurrentConfig();
      
      const result = sessionCacheService.saveSessionSettings({
        provider: currentConfig.provider,
        model: currentConfig.model,
        parameters: currentConfig.parameters
      });

      if (result.success) {
        updateCacheInfo();
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          lastError: null
        }));
        return true;
      } else {
        setError(result.error || 'Failed to save to cache');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to save to cache: ${errorMessage}`);
      return false;
    }
  }, [setLoading, setError, updateCacheInfo]);

  /**
   * Clears all cached data
   */
  const clearCache = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    
    try {
      const result = sessionCacheService.clearSessionCache();
      
      if (result.success) {
        updateCacheInfo();
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          lastError: null
        }));
        return true;
      } else {
        setError(result.error || 'Failed to clear cache');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to clear cache: ${errorMessage}`);
      return false;
    }
  }, [setLoading, setError, updateCacheInfo]);

  /**
   * Gets cached settings without loading them into provider config
   */
  const getCachedSettings = useCallback(async (): Promise<SessionSettings | null> => {
    try {
      const result = sessionCacheService.loadSessionSettings();
      return result.success ? result.data : null;
    } catch (error) {
      console.warn('Failed to get cached settings:', error);
      return null;
    }
  }, []);

  /**
   * Refresh cache info (exposed method)
   */
  const refreshCacheInfo = useCallback(() => {
    updateCacheInfo();
  }, [updateCacheInfo]);

  // Initialize cache info on mount
  useEffect(() => {
    updateCacheInfo();
  }, [updateCacheInfo]);

  // Set up periodic cache info refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.isLoading) {
        updateCacheInfo();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [updateCacheInfo, state.isLoading]);

  // Listen for provider config changes to update cache info
  useEffect(() => {
    const handleConfigChange = () => {
      // Small delay to allow the cache to be updated first
      setTimeout(updateCacheInfo, 100);
    };

    providerConfigService.addEventListener('provider-changed', handleConfigChange);
    providerConfigService.addEventListener('parameters-changed', handleConfigChange);

    return () => {
      providerConfigService.removeEventListener('provider-changed', handleConfigChange);
      providerConfigService.removeEventListener('parameters-changed', handleConfigChange);
    };
  }, [updateCacheInfo]);

  return {
    ...state,
    loadFromCache,
    saveToCache,
    clearCache,
    refreshCacheInfo,
    getCachedSettings
  };
}

/**
 * Hook for auto-saving settings to cache when they change
 * This hook automatically saves provider settings to session cache whenever they change
 * 
 * @param enabled - Whether auto-save is enabled
 * @param debounceMs - Debounce delay for auto-save (default: 1000ms)
 * 
 * @example
 * ```tsx
 * function AutoSaveProvider({ children }: { children: React.ReactNode }) {
 *   useAutoSaveCache(true, 1500); // Auto-save with 1.5s debounce
 *   return <>{children}</>;
 * }
 * ```
 */
export function useAutoSaveCache(enabled: boolean = true, debounceMs: number = 1000) {
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleConfigChange = () => {
      // Clear existing timeout
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }

      // Set new timeout for debounced save
      const newTimeoutId = setTimeout(async () => {
        try {
          const currentConfig = providerConfigService.getCurrentConfig();
          await sessionCacheService.saveSessionSettings({
            provider: currentConfig.provider,
            model: currentConfig.model,
            parameters: currentConfig.parameters
          });
        } catch (error) {
          console.warn('Auto-save to session cache failed:', error);
        }
      }, debounceMs);

      setSaveTimeoutId(newTimeoutId);
    };

    // Listen for config changes
    providerConfigService.addEventListener('provider-changed', handleConfigChange);
    providerConfigService.addEventListener('parameters-changed', handleConfigChange);

    return () => {
      // Cleanup
      providerConfigService.removeEventListener('provider-changed', handleConfigChange);
      providerConfigService.removeEventListener('parameters-changed', handleConfigChange);
      
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
    };
  }, [enabled, debounceMs, saveTimeoutId]);
}