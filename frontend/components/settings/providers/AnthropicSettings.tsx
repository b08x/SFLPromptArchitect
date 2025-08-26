/**
 * @file AnthropicSettings.tsx
 * @description Provider-specific settings component for Anthropic Claude.
 * This component handles Anthropic-specific configuration options including
 * API key management, model parameters, and system message configuration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ProviderSettingsProps } from './types';

/**
 * Anthropic-specific parameter settings
 */
interface AnthropicParameters {
  temperature: number;
  top_p: number;
  top_k: number;
  max_tokens: number;
  system?: string;
}

/**
 * Parameter constraints for Anthropic models
 */
const ANTHROPIC_CONSTRAINTS = {
  temperature: { min: 0, max: 1, step: 0.01, default: 0.7 },
  top_p: { min: 0, max: 1, step: 0.01, default: 0.9 },
  top_k: { min: 0, max: 200, step: 1, default: 40 },
  max_tokens: { min: 1, max: 8192, step: 1, default: 2048 },
};

/**
 * Anthropic-specific settings component
 * Renders configuration options specific to Claude models
 */
const AnthropicSettings: React.FC<ProviderSettingsProps> = ({
  apiKey,
  onApiKeyChange,
  onValidate,
  validationStatus,
  validationError,
  isValidating,
  onSetupComplete,
  config
}) => {
  // Parameter settings state
  const [parameters, setParameters] = useState<AnthropicParameters>({
    temperature: ANTHROPIC_CONSTRAINTS.temperature.default,
    top_p: ANTHROPIC_CONSTRAINTS.top_p.default,
    top_k: ANTHROPIC_CONSTRAINTS.top_k.default,
    max_tokens: ANTHROPIC_CONSTRAINTS.max_tokens.default,
    system: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');
  const [parameterErrors, setParameterErrors] = useState<Record<string, string>>({});

  // Initialize parameters from config when available
  useEffect(() => {
    if (config && typeof config === 'object') {
      setParameters(prev => ({ ...prev, ...config }));
      if (config.system) {
        setSystemMessage(config.system);
      }
    }
  }, [config]);

  // Debounced parameter update to avoid excessive calls
  const debouncedParameterUpdate = useCallback(
    debounce((newParams: AnthropicParameters) => {
      // Validate parameters
      const errors: Record<string, string> = {};
      
      Object.entries(ANTHROPIC_CONSTRAINTS).forEach(([key, constraint]) => {
        const value = newParams[key as keyof AnthropicParameters] as number;
        if (value < constraint.min || value > constraint.max) {
          errors[key] = `${key} must be between ${constraint.min} and ${constraint.max}`;
        }
      });
      
      setParameterErrors(errors);
      
      // Call parent update if valid
      if (Object.keys(errors).length === 0) {
        // This would integrate with parent component's parameter handling
        console.log('Updated Anthropic parameters:', newParams);
      }
    }, 300),
    []
  );

  // Handle parameter changes
  const handleParameterChange = (key: keyof AnthropicParameters, value: number | string) => {
    const newParameters = {
      ...parameters,
      [key]: value,
    };
    setParameters(newParameters);
    debouncedParameterUpdate(newParameters);
  };

  // Handle system message changes
  const handleSystemMessageChange = (value: string) => {
    setSystemMessage(value);
    handleParameterChange('system', value);
  };

  // Render parameter control
  const renderParameterControl = (key: keyof typeof ANTHROPIC_CONSTRAINTS, label: string, description: string) => {
    const constraint = ANTHROPIC_CONSTRAINTS[key];
    const currentValue = parameters[key] as number;
    const hasError = parameterErrors[key];

    return (
      <div key={key} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-primary">
              {label}
            </label>
            <div className="group relative">
              <button className="text-text-tertiary hover:text-text-secondary" type="button">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                {description}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasError && (
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <span className="text-xs text-text-tertiary">
              {constraint.min} - {constraint.max}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          {/* Range Slider */}
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min={constraint.min}
              max={constraint.max}
              step={constraint.step}
              value={currentValue}
              onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
              className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                hasError ? 'bg-red-200' : 'bg-gray-200'
              }`}
              style={{
                background: hasError 
                  ? 'linear-gradient(to right, #fca5a5 0%, #fca5a5 100%)' 
                  : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentValue - constraint.min) / (constraint.max - constraint.min)) * 100}%, #e5e7eb ${((currentValue - constraint.min) / (constraint.max - constraint.min)) * 100}%, #e5e7eb 100%)`
              }}
            />
            <input
              type="number"
              min={constraint.min}
              max={constraint.max}
              step={constraint.step}
              value={currentValue}
              onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
              className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                hasError 
                  ? 'border-red-500 bg-red-50 text-red-900' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>
          
          {/* Quick preset buttons */}
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => handleParameterChange(key, constraint.min)}
              className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Min
            </button>
            <button
              type="button"
              onClick={() => handleParameterChange(key, constraint.default)}
              className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => handleParameterChange(key, constraint.max)}
              className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Max
            </button>
          </div>
          
          {/* Error message */}
          {hasError && (
            <p className="text-xs text-red-600 mt-1">{hasError}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Anthropic-specific Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Anthropic Claude Configuration
        </h3>
        <p className="text-sm text-blue-700">
          Configure your Claude API access and model parameters for advanced conversational AI capabilities.
          Claude models excel at analysis, writing, and complex reasoning tasks.
        </p>
      </div>

      {/* API Key Input */}
      <div>
        <label htmlFor="anthropic-api-key" className="block text-sm font-medium text-text-primary mb-2">
          Anthropic API Key
        </label>
        <input
          type="password"
          id="anthropic-api-key"
          name="anthropic-api-key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
        />
        <p className="mt-2 text-sm text-text-tertiary">
          Get your API key from the{' '}
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            Anthropic Console
          </a>
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
            {isValidating ? 'Validating...' : 'Validate Anthropic API Key'}
          </span>
        </button>
      </div>

      {/* Validation Status */}
      {validationStatus !== 'idle' && (
        <div className="space-y-2">
          {validationStatus === 'valid' && (
            <div className="flex items-center space-x-2 text-green-600">
              <span className="w-5 h-5">✓</span>
              <span className="font-medium">Anthropic API key validated successfully</span>
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

      {/* Parameter Configuration Section - Only show if API key is validated */}
      {validationStatus === 'valid' && (
        <div className="space-y-6">
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-text-primary">Model Parameters</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Configure how Claude generates responses
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </button>
            </div>

            {/* Basic Parameters */}
            <div className="space-y-6">
              {renderParameterControl('temperature', 'Temperature', 'Controls randomness in generation. Higher values (0.8-1.0) produce more creative but less predictable responses.')}
              {renderParameterControl('max_tokens', 'Max Tokens', 'Maximum number of tokens to generate in the response. Higher values allow longer responses but cost more.')}
            </div>

            {/* Advanced Parameters */}
            {showAdvanced && (
              <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-text-primary mb-4">Advanced Parameters</h4>
                {renderParameterControl('top_p', 'Top P (Nucleus Sampling)', 'Controls diversity via nucleus sampling. Lower values (0.1-0.5) focus on more likely tokens.')}
                {renderParameterControl('top_k', 'Top K', 'Limits the number of highest probability vocabulary tokens to consider. Lower values increase focus.')}
              </div>
            )}

            {/* System Message Configuration */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <label htmlFor="anthropic-system-message" className="block text-sm font-medium text-text-primary">
                  System Message
                  <span className="text-text-tertiary font-normal ml-2">(Optional)</span>
                </label>
                <textarea
                  id="anthropic-system-message"
                  value={systemMessage}
                  onChange={(e) => handleSystemMessageChange(e.target.value)}
                  placeholder="Enter a system message to set Claude's behavior and context..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                />
                <p className="text-xs text-text-tertiary">
                  The system message helps set Claude's behavior, personality, and context for the conversation.
                  Leave empty to use Claude's default behavior.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claude Features Info */}
      {validationStatus !== 'valid' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">
            Claude Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-text-secondary">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Long-form content generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Complex reasoning and analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Code generation and review</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Document processing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Simple debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default AnthropicSettings;