/**
 * @file useProviderValidation.ts
 * @description React hook for managing AI provider validation and routing logic
 * @since 0.6.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isApplicationReady,
  checkProviderHealth,
  getStoredProviders,
  type AIProvider,
  type ProviderHealthResponse,
} from '../services/providerService';
import authService from '../services/authService';

export interface UseProviderValidationResult {
  /** Whether the application is ready (has at least one valid provider) */
  isReady: boolean;
  /** Whether we're currently checking provider status */
  isLoading: boolean;
  /** Error message if validation failed */
  error: string | null;
  /** The preferred provider if available */
  preferredProvider: AIProvider | null;
  /** Whether the user needs to configure providers */
  requiresSetup: boolean;
  /** List of providers with stored keys */
  storedProviders: AIProvider[];
  /** Function to manually refresh provider status */
  refresh: () => Promise<void>;
  /** Function to check if setup is complete and redirect if necessary */
  checkSetupComplete: () => Promise<boolean>;
}

/**
 * Hook for managing AI provider validation and routing logic
 */
export function useProviderValidation(): UseProviderValidationResult {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preferredProvider, setPreferredProvider] = useState<AIProvider | null>(null);
  const [requiresSetup, setRequiresSetup] = useState<boolean>(true);
  const [storedProviders, setStoredProviders] = useState<AIProvider[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  /**
   * Refresh provider validation status
   */
  const refresh = useCallback(async () => {
    // Don't run validation if not authenticated
    if (!authService.isAuthenticated()) {
      setIsReady(false);
      setPreferredProvider(null);
      setRequiresSetup(true);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Prevent concurrent refresh calls (this might not work across different component instances)
    // But it helps reduce some redundant calls
    setIsLoading(true);
    setError(null);
    
    try {
      const [health, stored] = await Promise.all([
        checkProviderHealth(),
        getStoredProviders(),
      ]);
      
      setIsReady(health.healthy);
      setPreferredProvider(health.preferredProvider);
      setRequiresSetup(health.requiresSetup);
      setStoredProviders(stored.providers || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsReady(false);
      setPreferredProvider(null);
      setRequiresSetup(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if setup is complete (used for navigation logic)
   */
  const checkSetupComplete = useCallback(async (): Promise<boolean> => {
    // Don't check if not authenticated
    if (!authService.isAuthenticated()) {
      return false;
    }
    
    try {
      const ready = await isApplicationReady();
      if (ready !== isReady) {
        // Refresh state if it changed
        await refresh();
      }
      return ready;
    } catch (err) {
      console.error('Error checking setup completion:', err);
      return false;
    }
  }, [isReady, refresh]);

  // Check authentication status and run validation - only run once on mount
  useEffect(() => {
    const checkAuthAndRefresh = () => {
      const authStatus = authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        refresh();
      } else {
        // Reset state when not authenticated
        setIsReady(false);
        setPreferredProvider(null);
        setRequiresSetup(true);
        setError(null);
        setIsLoading(false);
      }
    };

    checkAuthAndRefresh();
  }, []); // Only run on mount

  return {
    isReady,
    isLoading,
    error,
    preferredProvider,
    requiresSetup,
    storedProviders,
    refresh,
    checkSetupComplete,
  };
}

/**
 * Hook for checking if providers need setup (lightweight version)
 * This can be used for quick checks without full validation
 */
export function useProviderSetupCheck() {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkSetup = useCallback(async () => {
    // Don't check if not authenticated
    if (!authService.isAuthenticated()) {
      setNeedsSetup(true);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const ready = await isApplicationReady();
      setNeedsSetup(!ready);
    } catch (err) {
      console.error('Error checking provider setup:', err);
      setNeedsSetup(true); // Default to requiring setup on error
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkSetup();
  }, []); // Only run on mount

  return {
    needsSetup,
    isChecking,
    recheckSetup: checkSetup,
  };
}