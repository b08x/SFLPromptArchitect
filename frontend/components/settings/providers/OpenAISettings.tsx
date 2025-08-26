/**
 * @file OpenAISettings.tsx
 * @description Provider-specific settings component for OpenAI.
 * This component handles OpenAI-specific configuration options including
 * API key management, model selection, and provider-specific parameters.
 */

import React from 'react';
import { ProviderSettingsProps } from './types';

/**
 * OpenAI-specific settings component
 * Renders configuration options specific to GPT models
 */
const OpenAISettings: React.FC<ProviderSettingsProps> = ({
  apiKey,
  onApiKeyChange,
  onValidate,
  validationStatus,
  validationError,
  isValidating,
  onSetupComplete
}) => {
  return (
    <div className="space-y-6">
      {/* OpenAI-specific Information */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-green-800 mb-2">
          OpenAI Configuration
        </h3>
        <p className="text-sm text-green-700">
          Configure your OpenAI API access for GPT models.
          Access to industry-leading language models including GPT-4 and GPT-3.5.
        </p>
      </div>

      {/* API Key Input */}
      <div>
        <label htmlFor="openai-api-key" className="block text-sm font-medium text-text-primary mb-2">
          OpenAI API Key
        </label>
        <input
          type="password"
          id="openai-api-key"
          name="openai-api-key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="sk-..."
          className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
        />
        <p className="mt-2 text-sm text-text-tertiary">
          Get your API key from the{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            OpenAI Platform
          </a>
        </p>
      </div>

      {/* OpenAI-specific Features Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary">
          OpenAI Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-text-secondary">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Advanced reasoning</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Function calling</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Fine-tuning support</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Vision capabilities (GPT-4V)</span>
          </div>
        </div>
      </div>

      {/* Available Models Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Available GPT Models
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div><strong>GPT-4:</strong> Most capable model, best for complex tasks requiring reasoning</div>
          <div><strong>GPT-4 Turbo:</strong> More affordable and faster version of GPT-4</div>
          <div><strong>GPT-3.5 Turbo:</strong> Fast and efficient for simpler tasks</div>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          Usage Guidelines
        </h4>
        <p className="text-sm text-yellow-700">
          Monitor your usage on the OpenAI dashboard to avoid unexpected charges.
          Consider setting usage limits for production applications.
        </p>
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
            {isValidating ? 'Validating...' : 'Validate OpenAI API Key'}
          </span>
        </button>
      </div>

      {/* Validation Status */}
      {validationStatus !== 'idle' && (
        <div className="space-y-2">
          {validationStatus === 'valid' && (
            <div className="flex items-center space-x-2 text-green-600">
              <span className="w-5 h-5">✓</span>
              <span className="font-medium">OpenAI API key validated successfully</span>
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
    </div>
  );
};

export default OpenAISettings;