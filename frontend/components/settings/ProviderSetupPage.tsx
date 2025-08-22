/**
 * @file ProviderSetupPage.tsx
 * @description This component provides the AI Provider Configuration interface.
 * It allows users to select AI providers (Google, OpenAI, OpenRouter), 
 * enter API keys, and validate them. This is the foundational component
 * for the multi-provider AI integration system.
 *
 * @requires react
 * @requires ../icons/CogIcon
 */

import React, { useState, useEffect } from 'react';
import CogIcon from '../icons/CogIcon';
import ArrowPathIcon from '../icons/ArrowPathIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import XCircleIcon from '../icons/XCircleIcon';
import { AIProvider, validateApiKey, listModels } from '../../services/aiService';

/**
 * @interface ProviderSetupPageProps
 * @description Defines the props for the `ProviderSetupPage` component.
 */
interface ProviderSetupPageProps {
  /** Callback called when setup is successfully completed */
  onSetupComplete?: () => void;
}

/**
 * Validation status type for API key validation
 */
type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

/**
 * The main Provider Setup Page component.
 * Provides UI for configuring AI provider settings including provider selection,
 * API key input, and validation functionality.
 *
 * @param {ProviderSetupPageProps} props - The props for the component (currently none).
 * @returns {JSX.Element} The rendered provider setup page.
 */
const ProviderSetupPage: React.FC<ProviderSetupPageProps> = ({ onSetupComplete }) => {
  // State management with localStorage integration
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('google');
  const [apiKey, setApiKey] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  // Load state from localStorage on component mount
  useEffect(() => {
    try {
      const savedProvider = localStorage.getItem('sfl-ai-provider') as AIProvider;
      const savedApiKey = localStorage.getItem('sfl-api-key');
      const savedModel = localStorage.getItem('sfl-selected-model');
      
      if (savedProvider && ['google', 'openai', 'openrouter'].includes(savedProvider)) {
        setSelectedProvider(savedProvider);
      }
      
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
      
      if (savedModel) {
        setSelectedModel(savedModel);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      // Continue with default values if localStorage is unavailable
    }
  }, []);

  // Save state to localStorage whenever selectedProvider or apiKey changes
  useEffect(() => {
    try {
      localStorage.setItem('sfl-ai-provider', selectedProvider);
    } catch (error) {
      console.warn('Failed to save provider to localStorage:', error);
    }
  }, [selectedProvider]);

  useEffect(() => {
    try {
      if (apiKey) {
        localStorage.setItem('sfl-api-key', apiKey);
      } else {
        localStorage.removeItem('sfl-api-key');
      }
    } catch (error) {
      console.warn('Failed to save API key to localStorage:', error);
    }
  }, [apiKey]);

  // Save selected model to localStorage
  useEffect(() => {
    try {
      if (selectedModel) {
        localStorage.setItem('sfl-selected-model', selectedModel);
      } else {
        localStorage.removeItem('sfl-selected-model');
      }
    } catch (error) {
      console.warn('Failed to save selected model to localStorage:', error);
    }
  }, [selectedModel]);

  // Event handlers
  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const provider = event.target.value as AIProvider;
    setSelectedProvider(provider);
    // Reset validation status and model selection when provider changes
    setValidationStatus('idle');
    setAvailableModels([]);
    setSelectedModel('');
    setValidationError('');
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
    // Reset validation status when API key changes
    if (validationStatus !== 'idle') {
      setValidationStatus('idle');
      setAvailableModels([]);
      setSelectedModel('');
      setValidationError('');
    }
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  // API Key Validation Handler (UX-01-C)
  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setValidationError('API key is required');
      return;
    }

    setValidationStatus('validating');
    setValidationError('');
    setIsLoadingModels(false);

    try {
      // Validate API key
      await validateApiKey(selectedProvider, apiKey);
      setValidationStatus('valid');
      
      // Upon successful validation, fetch available models (UX-01-D)
      setIsLoadingModels(true);
      try {
        const models = await listModels(selectedProvider, apiKey);
        setAvailableModels(models);
        
        // Auto-select first model if none is currently selected
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0]);
        }
      } catch (modelError) {
        console.warn('Failed to fetch models, but API key is valid:', modelError);
        // Don't change validation status - key is still valid
        setAvailableModels([]);
      } finally {
        setIsLoadingModels(false);
      }

      // Notify parent component that setup is complete
      if (onSetupComplete) {
        onSetupComplete();
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationError(error instanceof Error ? error.message : 'Validation failed');
      setAvailableModels([]);
      setSelectedModel('');
    }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3 mb-8">
        <CogIcon className="w-8 h-8 text-accent-primary" />
        <h1 className="text-3xl font-bold text-text-primary">
          AI Provider Configuration
        </h1>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-surface rounded-lg border border-border-primary p-6 space-y-8">
        
        {/* Provider Selection Section */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Select AI Provider
          </h2>
          <p className="text-text-secondary mb-6">
            Choose your preferred AI provider to configure API access.
          </p>
          
          <div className="space-y-4">
            {/* Google Provider Option */}
            <label className="flex items-center p-4 border border-border-secondary rounded-md hover:bg-surface-hover transition-colors cursor-pointer">
              <input
                type="radio"
                name="provider"
                value="google"
                checked={selectedProvider === 'google'}
                onChange={handleProviderChange}
                className="w-4 h-4 text-accent-primary bg-surface border-border-interactive focus:ring-accent-primary focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface"
              />
              <div className="ml-3">
                <div className="text-text-primary font-medium">Google Gemini</div>
                <div className="text-text-tertiary text-sm">
                  Access to Google's Gemini models including Flash and Pro versions
                </div>
              </div>
            </label>

            {/* OpenAI Provider Option */}
            <label className="flex items-center p-4 border border-border-secondary rounded-md hover:bg-surface-hover transition-colors cursor-pointer">
              <input
                type="radio"
                name="provider"
                value="openai"
                checked={selectedProvider === 'openai'}
                onChange={handleProviderChange}
                className="w-4 h-4 text-accent-primary bg-surface border-border-interactive focus:ring-accent-primary focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface"
              />
              <div className="ml-3">
                <div className="text-text-primary font-medium">OpenAI</div>
                <div className="text-text-tertiary text-sm">
                  Access to OpenAI's GPT models including GPT-4 and GPT-3.5
                </div>
              </div>
            </label>

            {/* OpenRouter Provider Option */}
            <label className="flex items-center p-4 border border-border-secondary rounded-md hover:bg-surface-hover transition-colors cursor-pointer">
              <input
                type="radio"
                name="provider"
                value="openrouter"
                checked={selectedProvider === 'openrouter'}
                onChange={handleProviderChange}
                className="w-4 h-4 text-accent-primary bg-surface border-border-interactive focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface"
              />
              <div className="ml-3">
                <div className="text-text-primary font-medium">OpenRouter</div>
                <div className="text-text-tertiary text-sm">
                  Access to multiple models through OpenRouter's unified API
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* API Key Configuration Section */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            API Key Configuration
          </h2>
          <p className="text-text-secondary mb-6">
            Enter your API key for the selected provider to enable AI model access.
          </p>
          
          <div className="space-y-4">
            {/* API Key Input */}
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-text-primary mb-2">
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                name="apiKey"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your API key..."
                className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
              />
              <p className="mt-2 text-sm text-text-tertiary">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>

            {/* Validation Button */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleValidate}
                disabled={!apiKey.trim() || validationStatus === 'validating'}
                className="flex items-center space-x-2 px-6 py-2 bg-primary-action text-text-primary font-medium rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validationStatus === 'validating' && (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                )}
                <span>
                  {validationStatus === 'validating' ? 'Validating...' : 'Validate API Key'}
                </span>
              </button>
            </div>

            {/* Validation Status Display */}
            {validationStatus !== 'idle' && (
              <div className="flex items-center space-x-2">
                {validationStatus === 'validating' && (
                  <>
                    <ArrowPathIcon className="w-5 h-5 text-accent-primary animate-spin" />
                    <span className="text-accent-primary font-medium">Validating API key...</span>
                  </>
                )}
                {validationStatus === 'valid' && (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 font-medium">API key is valid</span>
                    {isLoadingModels && (
                      <>
                        <ArrowPathIcon className="w-4 h-4 text-accent-primary animate-spin ml-4" />
                        <span className="text-accent-primary">Loading models...</span>
                      </>
                    )}
                  </>
                )}
                {validationStatus === 'invalid' && (
                  <>
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                    <div className="flex flex-col">
                      <span className="text-red-500 font-medium">API key validation failed</span>
                      {validationError && (
                        <span className="text-red-400 text-sm mt-1">{validationError}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Model Selection Dropdown (UX-01-D) */}
            {validationStatus === 'valid' && availableModels.length > 0 && (
              <div>
                <label htmlFor="modelSelect" className="block text-sm font-medium text-text-primary mb-2">
                  Select Model
                </label>
                <select
                  id="modelSelect"
                  name="modelSelect"
                  value={selectedModel}
                  onChange={handleModelChange}
                  disabled={isLoadingModels}
                  className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Choose a model...</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                {selectedModel && (
                  <p className="mt-2 text-sm text-text-tertiary">
                    Selected model: <span className="font-medium text-text-secondary">{selectedModel}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        <div className="border-t border-border-secondary pt-6">
          {validationStatus === 'idle' && (
            <div className="text-sm text-text-tertiary">
              Select a provider and enter your API key to begin validation.
            </div>
          )}
          {validationStatus === 'valid' && availableModels.length === 0 && !isLoadingModels && (
            <div className="text-sm text-yellow-600">
              API key is valid, but no models could be loaded. You can still proceed with manual model specification.
            </div>
          )}
          {validationStatus === 'valid' && selectedModel && (
            <div className="text-sm text-green-600">
              Configuration complete! You're ready to use {selectedProvider} with the {selectedModel} model.
            </div>
          )}
        </div>
      </div>

      {/* Additional Information Card */}
      <div className="bg-surface rounded-lg border border-border-primary p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          Getting Started
        </h3>
        <div className="space-y-3 text-text-secondary">
          <p>
            <strong className="text-text-primary">1. Choose your provider:</strong> Select the AI service you want to use based on your needs and preferences.
          </p>
          <p>
            <strong className="text-text-primary">2. Obtain an API key:</strong> Visit your provider's website to create an account and generate an API key.
          </p>
          <p>
            <strong className="text-text-primary">3. Configure access:</strong> Enter your API key and validate it to ensure proper connectivity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProviderSetupPage;