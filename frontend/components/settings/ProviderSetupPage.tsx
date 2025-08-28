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
import { AIProvider } from '../../types/aiProvider';
import { getProviderComponent, providerMetadata, ValidationStatus } from './providers';
import { useConfiguredProviders, useProviderStore } from '../../store/providerStore';

interface ProviderSetupPageProps {
  onSaveApiKey: (provider: AIProvider, apiKey: string) => Promise<{success: boolean, error?: string}>;
}

const ProviderSetupPage: React.FC<ProviderSetupPageProps> = ({ onSaveApiKey }) => {
  const configuredProviders = useConfiguredProviders();
  const { refreshProviders } = useProviderStore();
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('google');
  const [apiKey, setApiKey] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (configuredProviders.includes(selectedProvider)) {
      setValidationStatus('valid');
    } else {
      setValidationStatus('idle');
    }
  }, [selectedProvider, configuredProviders]);

  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const provider = event.target.value as AIProvider;
    setSelectedProvider(provider);
    setApiKey('');
    setValidationError('');
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (validationStatus !== 'idle') {
      setValidationStatus('idle');
      setValidationError('');
    }
  };

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setValidationError('API key is required');
      return;
    }

    setValidationStatus('validating');
    setValidationError('');

    const result = await onSaveApiKey(selectedProvider, apiKey.trim());
    
    if (result.success) {
      setValidationStatus('valid');
      setApiKey('');
      // Refresh providers store to reflect new configuration
      await refreshProviders();
    } else {
      setValidationStatus('invalid');
      setValidationError(result.error || 'Validation failed');
    }
  };

  const ProviderComponent = getProviderComponent(selectedProvider);
  const availableProviders = Object.keys(providerMetadata) as AIProvider[];
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <CogIcon className="w-8 h-8 text-accent-primary" />
        <h1 className="text-3xl font-bold text-text-primary">
          AI Provider Configuration
        </h1>
      </div>

      <div className="bg-surface rounded-lg border border-border-primary p-6 space-y-8">
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
                      {configuredProviders.includes(provider) && (
                        <span className="text-green-500">✓ Configured</span>
                      )}
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

        <div className="border-t border-border-secondary pt-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {providerMetadata[selectedProvider].name} Configuration
          </h2>
          
          <ProviderComponent
            provider={selectedProvider}
            apiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
            onValidate={handleValidate}
            validationStatus={validationStatus}
            validationError={validationError}
            isValidating={validationStatus === 'validating'}
            onSetupComplete={() => refreshProviders()}
          />
        </div>
      </div>

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