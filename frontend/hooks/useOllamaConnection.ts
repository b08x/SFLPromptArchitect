/**
 * @file useOllamaConnection.ts
 * @description Custom hook for managing Ollama server connections and model discovery.
 * Provides reusable logic for testing connections, fetching available models,
 * and managing connection state.
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Ollama model information interface
 */
interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

/**
 * Connection status type
 */
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Hook return type
 */
interface UseOllamaConnectionReturn {
  connectionStatus: ConnectionStatus;
  availableModels: OllamaModel[];
  isLoadingModels: boolean;
  connectionError: string;
  lastConnectionTest: number;
  testConnection: (baseURL: string) => Promise<boolean>;
  fetchAvailableModels: (baseURL: string) => Promise<OllamaModel[]>;
  resetConnection: () => void;
}

/**
 * Custom hook for managing Ollama server connections
 * @returns Hook interface with connection management functions and state
 */
export const useOllamaConnection = (): UseOllamaConnectionReturn => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [lastConnectionTest, setLastConnectionTest] = useState<number>(0);
  
  // Use ref to prevent race conditions in rapid successive calls
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Tests connection to Ollama server
   * @param baseURL - The base URL to test
   * @returns Promise resolving to connection success status
   */
  const testConnection = useCallback(async (baseURL: string): Promise<boolean> => {
    if (!baseURL.trim()) {
      setConnectionError('Base URL is required');
      setConnectionStatus('error');
      return false;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setConnectionStatus('connecting');
    setConnectionError('');
    
    try {
      const response = await fetch(`${baseURL}/api/version`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        setConnectionStatus('connected');
        setLastConnectionTest(Date.now());
        
        // Automatically fetch models after successful connection
        try {
          const models = await fetchAvailableModels(baseURL);
          setAvailableModels(models);
        } catch (modelError) {
          console.warn('Failed to fetch models after connection:', modelError);
          // Don't fail the connection test if model fetching fails
        }
        
        return true;
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return false;
      }
      
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(`Connection failed: ${errorMessage}`);
      return false;
    }
  }, []);

  /**
   * Fetches available models from Ollama server
   * @param baseURL - The base URL to query
   * @returns Promise resolving to array of available models
   */
  const fetchAvailableModels = useCallback(async (baseURL: string): Promise<OllamaModel[]> => {
    if (!baseURL.trim()) {
      throw new Error('Base URL is required');
    }

    setIsLoadingModels(true);
    setConnectionError('');

    try {
      const response = await fetch(`${baseURL}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const models = data.models || [];
      
      // Sort models by name for consistent display
      models.sort((a: OllamaModel, b: OllamaModel) => a.name.localeCompare(b.name));
      
      setAvailableModels(models);
      return models;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Let the caller handle abort errors
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load models';
      setConnectionError(errorMessage);
      setAvailableModels([]);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  /**
   * Resets all connection state to initial values
   */
  const resetConnection = useCallback(() => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    setAvailableModels([]);
    setIsLoadingModels(false);
    setConnectionError('');
    setLastConnectionTest(0);
  }, []);

  return {
    connectionStatus,
    availableModels,
    isLoadingModels,
    connectionError,
    lastConnectionTest,
    testConnection,
    fetchAvailableModels,
    resetConnection,
  };
};

export default useOllamaConnection;