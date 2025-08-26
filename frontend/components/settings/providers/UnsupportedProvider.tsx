/**
 * @file UnsupportedProvider.tsx
 * @description Fallback component for providers that don't have dedicated settings components yet.
 * This component provides a generic interface and information about upcoming support.
 */

import React from 'react';
import { ProviderSettingsProps } from './types';

/**
 * Fallback component for unsupported or upcoming providers
 * Shows information about the provider and indicates that dedicated settings are coming soon
 */
const UnsupportedProvider: React.FC<ProviderSettingsProps> = ({
  provider,
  apiKey,
  onApiKeyChange,
  onValidate,
  validationStatus,
  validationError,
  isValidating,
  onSetupComplete
}) => {
  // Provider display names mapping
  const providerNames: Record<string, string> = {
    cohere: 'Cohere',
    mistral: 'Mistral AI',
    groq: 'Groq',
    huggingface: 'Hugging Face',
    together: 'Together AI',
    replicate: 'Replicate'
  };

  const displayName = providerNames[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="space-y-6">
      {/* Provider Information */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-amber-800 mb-2">
          {displayName} Configuration
        </h3>
        <p className="text-sm text-amber-700">
          Dedicated settings for {displayName} are coming soon. You can still configure basic API access below.
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-blue-100 rounded-full">
          <span className="text-2xl">🚧</span>
        </div>
        <h4 className="text-lg font-medium text-blue-900 mb-2">
          Enhanced {displayName} Support Coming Soon
        </h4>
        <p className="text-sm text-blue-700 mb-4">
          We're working on dedicated configuration options for {displayName} including:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-600">
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Provider-specific parameters</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Model selection interface</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Usage optimization tips</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Cost estimation</span>
          </div>
        </div>
      </div>

      {/* Basic API Key Configuration */}
      <div>
        <label htmlFor={`${provider}-api-key`} className="block text-sm font-medium text-text-primary mb-2">
          {displayName} API Key
        </label>
        <input
          type="password"
          id={`${provider}-api-key`}
          name={`${provider}-api-key`}
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="Enter your API key..."
          className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
        />
        <p className="mt-2 text-sm text-text-tertiary">
          Please refer to {displayName}'s documentation for API key setup instructions.
        </p>
      </div>

      {/* Generic Features */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary">
          {displayName} Integration
        </h4>
        <div className="text-sm text-text-secondary">
          <p>
            Basic {displayName} integration is available. Enhanced configuration options
            with provider-specific settings and optimizations are under development.
          </p>
        </div>
      </div>

      {/* Validation Button */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onValidate}
          disabled={!apiKey.trim() || isValidating}
          className="flex items-center space-x-2 px-6 py-2 bg-primary-action text-text-primary font-medium rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>
            {isValidating ? 'Validating...' : `Validate ${displayName} API Key`}
          </span>
        </button>
      </div>

      {/* Validation Status */}
      {validationStatus !== 'idle' && (
        <div className="space-y-2">
          {validationStatus === 'valid' && (
            <div className="flex items-center space-x-2 text-green-600">
              <span className="w-5 h-5">✓</span>
              <span className="font-medium">{displayName} API key validated successfully</span>
            </div>
          )}
          {validationStatus === 'invalid' && (
            <div className="flex items-center space-x-2 text-red-600">
              <span className="w-5 h-5">✗</span>
              <div className="flex flex-col">
                <span className="font-medium">Validation failed</span>
                {validationError && (
                  <span className="text-sm text-red-500 mt-1">{validationError}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Help Us Improve
        </h4>
        <p className="text-sm text-gray-600">
          Using {displayName}? Let us know what features you'd like to see in the dedicated
          configuration interface. Your feedback helps us prioritize development.
        </p>
      </div>
    </div>
  );
};

export default UnsupportedProvider;