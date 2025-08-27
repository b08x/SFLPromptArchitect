/**
 * @file OllamaSettings.tsx
 * @description Provider-specific settings component for Ollama.
 * This component handles Ollama-specific configuration options including
 * base URL configuration, dynamic model selection, connection testing,
 * and local deployment parameters.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ProviderSettingsProps, OllamaConfig } from './types';
import { sessionCacheService } from '../../../services/sessionCacheService';
import { useOllamaConnection } from '../../../hooks/useOllamaConnection';


/**
 * Ollama-specific settings component
 * Renders configuration options specific to Ollama local deployment
 */
const OllamaSettings: React.FC<ProviderSettingsProps> = ({
  apiKey,
  onApiKeyChange,
  onValidate,
  validationStatus,
  validationError,
  isValidating,
  onSetupComplete,
  config
}) => {
  // Use the custom Ollama connection hook
  const {
    connectionStatus,
    availableModels,
    isLoadingModels,
    connectionError,
    lastConnectionTest,
    testConnection,
    fetchAvailableModels,
    resetConnection
  } = useOllamaConnection();

  // State for Ollama-specific features
  const [baseURL, setBaseURL] = useState<string>(apiKey || 'http://localhost:11434');
  const [selectedModel, setSelectedModel] = useState<string>('');
  // Initialize from config or cached settings
  useEffect(() => {
    if (config?.baseURL) {
      setBaseURL(config.baseURL);
    }
    if (config?.selectedModel) {
      setSelectedModel(config.selectedModel);
    }
  }, [config]);

  // Handle base URL changes
  const handleBaseURLChange = useCallback((newBaseURL: string) => {
    setBaseURL(newBaseURL);
    onApiKeyChange(newBaseURL); // Use apiKey field to store baseURL for Ollama
    resetConnection();
    setSelectedModel('');
  }, [onApiKeyChange, resetConnection]);

  // Handle manual validation trigger
  const handleValidate = useCallback(async () => {
    const success = await testConnection(baseURL);
    onValidate();
    return success;
  }, [testConnection, baseURL, onValidate]);

  // Handle model refresh
  const handleRefreshModels = useCallback(async () => {
    if (connectionStatus === 'connected') {
      try {
        await fetchAvailableModels(baseURL);
      } catch (error) {
        console.error('Failed to refresh models:', error);
      }
    }
  }, [fetchAvailableModels, baseURL, connectionStatus]);

  // Auto-test connection when baseURL changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (baseURL.trim() && baseURL.startsWith('http')) {
        testConnection(baseURL);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [baseURL, testConnection]);

  // Auto-select first model when models are loaded
  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      setSelectedModel(availableModels[0].name);
    }
  }, [availableModels, selectedModel]);

  // Save configuration to session cache when relevant values change
  useEffect(() => {
    if (connectionStatus === 'connected' && selectedModel && baseURL) {
      const cacheConfig: OllamaConfig = {
        baseURL,
        selectedModel,
        availableModels: availableModels.map(m => m.name)
      };
      
      // Only update cache if we have meaningful data
      sessionCacheService.saveSessionSettings({
        provider: 'ollama',
        model: selectedModel,
        parameters: { baseURL, selectedModel }
      }).catch(error => {
        console.warn('Failed to cache Ollama settings:', error);
      });
    }
  }, [connectionStatus, selectedModel, baseURL, availableModels]);

  // Connection status indicator
  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Connected</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center space-x-2 text-yellow-600">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Connecting...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">Disconnected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium">Disconnected</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Ollama-specific Information */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-800">
            Ollama Configuration
          </h3>
          {getConnectionStatusIndicator()}
        </div>
        <p className="text-sm text-slate-700">
          Configure your local Ollama instance for privacy-focused AI inference.
          Run models locally on your own hardware for maximum privacy and control.
        </p>
      </div>

      {/* Base URL Configuration */}
      <div>
        <label htmlFor="ollama-base-url" className="block text-sm font-medium text-text-primary mb-2">
          Ollama Server URL
        </label>
        <div className="relative">
          <input
            type="text"
            id="ollama-base-url"
            name="ollama-base-url"
            value={baseURL}
            onChange={(e) => handleBaseURLChange(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors pr-12"
          />
          <button
            type="button"
            onClick={testConnection}
            disabled={!baseURL.trim() || connectionStatus === 'connecting'}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-text-tertiary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            title="Test connection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm text-text-tertiary">
          Default Ollama server runs on port 11434. Change if using a custom configuration.
        </p>
      </div>

      {/* Model Selection */}
      {connectionStatus === 'connected' && (
        <div>
          <label htmlFor="ollama-model" className="block text-sm font-medium text-text-primary mb-2">
            Available Models
          </label>
          <div className="relative">
            <select
              id="ollama-model"
              name="ollama-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoadingModels || availableModels.length === 0}
              className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a model...</option>
              {availableModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)
                </option>
              ))}
            </select>
            {isLoadingModels && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary"></div>
              </div>
            )}
          </div>
          {availableModels.length === 0 && !isLoadingModels && connectionStatus === 'connected' && (
            <p className="mt-2 text-sm text-orange-600">
              No models found. Pull a model first: <code className="bg-gray-100 px-1 rounded">ollama pull llama2</code>
            </p>
          )}
          {selectedModel && (
            <div className="mt-2 text-sm text-text-tertiary">
              <p>Selected model: <span className="font-medium text-text-primary">{selectedModel}</span></p>
              {availableModels.find(m => m.name === selectedModel)?.details && (
                <p>Family: <span className="font-medium text-text-primary">
                  {availableModels.find(m => m.name === selectedModel)?.details?.family || 'Unknown'}
                </span></p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {connectionError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm font-medium text-red-800">Connection Error</span>
          </div>
          <p className="text-sm text-red-700 mt-2">{connectionError}</p>
        </div>
      )}

      {/* Ollama-specific Features Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary">
          Ollama Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-text-secondary">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <span>Local deployment</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <span>Complete privacy</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <span>No internet required</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <span>Custom model support</span>
          </div>
        </div>
      </div>

      {/* Installation Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          Getting Started with Ollama
        </h4>
        <div className="space-y-2 text-sm text-blue-700">
          <p><strong>1. Install Ollama:</strong> Download from{' '}
            <a 
              href="https://ollama.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              ollama.ai
            </a>
          </p>
          <p><strong>2. Pull a model:</strong> <code className="bg-blue-100 px-1 rounded">ollama pull llama2</code></p>
          <p><strong>3. Start the server:</strong> <code className="bg-blue-100 px-1 rounded">ollama serve</code></p>
        </div>
      </div>

      {/* Available Models Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Popular Ollama Models
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div><strong>Llama 2:</strong> Meta's open-source language model (7B, 13B, 70B)</div>
          <div><strong>Code Llama:</strong> Code-specialized version of Llama 2</div>
          <div><strong>Mistral:</strong> Efficient and powerful 7B parameter model</div>
          <div><strong>Vicuna:</strong> Fine-tuned Llama model with improved chat capabilities</div>
        </div>
      </div>

      {/* System Requirements */}
      <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-orange-800 mb-2">
          System Requirements
        </h4>
        <p className="text-sm text-orange-700">
          Ensure adequate RAM and storage. Larger models require more resources.
          7B models need ~8GB RAM, 13B models need ~16GB RAM, 70B models need ~80GB RAM.
        </p>
      </div>

      {/* Validation Button */}
      <div className="flex justify-start space-x-3">
        <button
          type="button"
          onClick={handleValidate}
          disabled={!baseURL.trim() || isValidating || connectionStatus === 'connecting'}
          className="flex items-center space-x-2 px-6 py-2 bg-primary-action text-text-primary font-medium rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating || connectionStatus === 'connecting' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>
            {isValidating || connectionStatus === 'connecting' ? 'Testing Connection...' : 'Test Ollama Connection'}
          </span>
        </button>
        
        {connectionStatus === 'connected' && availableModels.length > 0 && (
          <button
            type="button"
            onClick={handleRefreshModels}
            disabled={isLoadingModels}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingModels ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>Refresh Models</span>
          </button>
        )}
      </div>

      {/* Validation Status */}
      {(validationStatus !== 'idle' || connectionStatus === 'connected') && (
        <div className="space-y-2">
          {(validationStatus === 'valid' || connectionStatus === 'connected') && (
            <div className="flex items-center space-x-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex flex-col">
                <span className="font-medium">Ollama server connection successful</span>
                {availableModels.length > 0 && (
                  <span className="text-sm text-green-500 mt-1">
                    Found {availableModels.length} model{availableModels.length !== 1 ? 's' : ''}
                    {lastConnectionTest > 0 && (
                      <span className="ml-2 text-xs text-green-400">
                        (tested {Math.round((Date.now() - lastConnectionTest) / 1000)}s ago)
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
          {validationStatus === 'invalid' && connectionStatus !== 'connected' && (
            <div className="flex items-center space-x-2 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div className="flex flex-col">
                <span className="font-medium">Connection failed</span>
                {validationError && (
                  <span className="text-sm text-red-500 mt-1">{validationError}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OllamaSettings;