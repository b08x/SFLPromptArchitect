/**
 * @file OllamaSettings.tsx
 * @description Provider-specific settings component for Ollama.
 * This component handles Ollama-specific configuration options including
 * connection setup, model selection, and local deployment parameters.
 */

import React from 'react';
import { ProviderSettingsProps } from './types';

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
  onSetupComplete
}) => {
  return (
    <div className="space-y-6">
      {/* Ollama-specific Information */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-slate-800 mb-2">
          Ollama Configuration
        </h3>
        <p className="text-sm text-slate-700">
          Configure your local Ollama instance for privacy-focused AI inference.
          Run models locally on your own hardware for maximum privacy and control.
        </p>
      </div>

      {/* Connection URL Input */}
      <div>
        <label htmlFor="ollama-url" className="block text-sm font-medium text-text-primary mb-2">
          Ollama Server URL
        </label>
        <input
          type="text"
          id="ollama-url"
          name="ollama-url"
          value={apiKey || 'http://localhost:11434'}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="http://localhost:11434"
          className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
        />
        <p className="mt-2 text-sm text-text-tertiary">
          Default Ollama server runs on port 11434. Change if using a custom configuration.
        </p>
      </div>

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
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onValidate}
          disabled={!apiKey.trim() || isValidating}
          className="flex items-center space-x-2 px-6 py-2 bg-primary-action text-text-primary font-medium rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>
            {isValidating ? 'Testing Connection...' : 'Test Ollama Connection'}
          </span>
        </button>
      </div>

      {/* Validation Status */}
      {validationStatus !== 'idle' && (
        <div className="space-y-2">
          {validationStatus === 'valid' && (
            <div className="flex items-center space-x-2 text-green-600">
              <span className="w-5 h-5">✓</span>
              <span className="font-medium">Ollama server connection successful</span>
            </div>
          )}
          {validationStatus === 'invalid' && (
            <div className="flex items-center space-x-2 text-red-600">
              <span className="w-5 h-5">✗</span>
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