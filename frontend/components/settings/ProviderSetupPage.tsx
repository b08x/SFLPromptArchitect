/**
 * @file ProviderSetupPage.tsx
 * @description Dynamic AI Provider Configuration interface with provider-specific components.
 * This component provides a dynamic system that renders different provider-specific 
 * settings components based on user selection. It maintains backward compatibility
 * while enabling extensible provider-specific customizations.
 *
 * @requires react
 * @requires ./providers - Provider-specific components
 * @requires ../icons/CogIcon
 */

import React, { useState, useEffect } from 'react';
import CogIcon from '../icons/CogIcon';
// Note: Provider-specific components handle their own validation UI and icons
import { AIProvider } from '../../services/aiService';
import { saveProviderApiKey, validateStoredProvider } from '../../services/providerService';
import { getProviderComponent, providerMetadata, ValidationStatus } from './providers';

/**
 * @interface ProviderSetupPageProps
 * @description Defines the props for the `ProviderSetupPage` component.
 */
interface ProviderSetupPageProps {
  /** Callback called when setup is successfully completed */
  onSetupComplete?: () => void;
}


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

  // Load state from secure backend storage on component mount
  useEffect(() => {
    const loadStoredSettings = async () => {
      try {
        // Check which providers have stored keys
        const response = await fetch('/api/providers/stored-keys', {
          credentials: 'include', // Include session cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.providers.length > 0) {
            // Set the first stored provider as default
            const firstProvider = data.data.providers[0] as AIProvider;
            if (Object.keys(providerMetadata).includes(firstProvider)) {
              setSelectedProvider(firstProvider);
              setValidationStatus('valid'); // Assume stored keys are valid
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load stored provider settings:', error);
        // Continue with default values if backend is unavailable
      }
    };
    
    loadStoredSettings();
  }, []);

  // Note: API keys and settings are now stored securely on the backend
  // No localStorage usage for sensitive data

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

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    // Reset validation status when API key changes
    if (validationStatus !== 'idle') {
      setValidationStatus('idle');
      setAvailableModels([]);
      setSelectedModel('');
      setValidationError('');
    }
  };

  // Model change handler - kept for backward compatibility but not used in dynamic components
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  // API Key Validation and Secure Storage Handler
  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setValidationError('API key is required');
      return;
    }

    setValidationStatus('validating');
    setValidationError('');
    setIsLoadingModels(false);

    try {
      // Save and validate API key through secure backend endpoint
      const result = await saveProviderApiKey(selectedProvider, apiKey.trim());
      
      if (result.success) {
        setValidationStatus('valid');
        
        // Clear the API key from frontend state immediately after successful storage
        setApiKey('');
        
        // Notify parent component that setup is complete
        if (onSetupComplete) {
          onSetupComplete();
        }
        
        // TODO: Implement model listing through backend proxy
        // For now, we'll skip model listing to maintain security
        setAvailableModels([]);
      } else {
        throw new Error(result.error || 'Failed to validate and store API key');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationError(error instanceof Error ? error.message : 'Validation failed');
      setAvailableModels([]);
      setSelectedModel('');
    }
  };
  // Get the appropriate component for the selected provider
  const ProviderComponent = getProviderComponent(selectedProvider);
  
  // Get available providers for selection
  const availableProviders = Object.keys(providerMetadata) as AIProvider[];
  
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
            {availableProviders.map((provider) => {
              const metadata = providerMetadata[provider];
              return (
                <label 
                  key={provider}
                  className="flex items-center p-4 border border-border-secondary rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="provider"
                    value={provider}
                    checked={selectedProvider === provider}
                    onChange={handleProviderChange}
                    className="w-4 h-4 text-accent-primary bg-surface border-border-interactive focus:ring-accent-primary focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-text-primary font-medium">{metadata.name}</span>
                      {!metadata.isSupported && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div className="text-text-tertiary text-sm">
                      {metadata.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Dynamic Provider-Specific Configuration */}
        <div className="border-t border-border-secondary pt-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {providerMetadata[selectedProvider].name} Configuration
          </h2>
          
          {/* Render the provider-specific component */}
          <ProviderComponent
            provider={selectedProvider}
            apiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
            onValidate={handleValidate}
            validationStatus={validationStatus}
            validationError={validationError}
            isValidating={validationStatus === 'validating'}
            onSetupComplete={onSetupComplete}
          />
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