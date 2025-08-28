/**
 * @file GoogleSettings.tsx
 * @description Provider-specific settings component for Google Gemini.
 * This component handles Google-specific configuration options including
 * API key management, model selection, and provider-specific parameters.
 * Features advanced UI patterns for Gemini-specific controls including
 * thinking budgets and safety settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ProviderSettingsProps } from './types';
import { ModelInfo } from '../../../types/aiProvider';

/**
 * Gemini-specific parameter settings
 */
interface GeminiParameters {
  temperature: number;
  top_p: number;
  top_k: number;
  max_tokens: number;
  thinking_budget?: number; // -1 for dynamic, 0 to disable, positive for token limit
  safety_settings?: GeminiSafetySettings;
}

/**
 * Gemini safety settings configuration
 */
interface GeminiSafetySettings {
  harmful_content: GeminiSafetyThreshold;
  harassment: GeminiSafetyThreshold;
  hate_speech: GeminiSafetyThreshold;
  sexual_content: GeminiSafetyThreshold;
  dangerous_content: GeminiSafetyThreshold;
}

/**
 * Gemini safety threshold levels
 */
type GeminiSafetyThreshold = 
  | 'HARM_BLOCK_NONE'
  | 'HARM_BLOCK_ONLY_HIGH'
  | 'HARM_BLOCK_MEDIUM_AND_ABOVE'
  | 'HARM_BLOCK_LOW_AND_ABOVE';

/**
 * Parameter constraints for Gemini models (different from Anthropic!)
 */
const GEMINI_CONSTRAINTS = {
  temperature: { min: 0, max: 2, step: 0.01, default: 0.9 },
  top_p: { min: 0, max: 1, step: 0.01, default: 0.95 },
  top_k: { min: 1, max: 40, step: 1, default: 20 },
  max_tokens: { min: 1, max: 8192, step: 1, default: 2048 },
  thinking_budget: { min: -1, max: 10000, step: 1, default: -1 },
};

/**
 * Models that support thinking budget feature
 */
const THINKING_CAPABLE_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash', 
  'gemini-2.5-flash-lite'
];

/**
 * Safety categories with descriptions
 */
const SAFETY_CATEGORIES = {
  harmful_content: {
    label: 'Harmful Content',
    description: 'Content that could cause harm to individuals or groups'
  },
  harassment: {
    label: 'Harassment',
    description: 'Content that harasses, threatens, or bullies an individual'
  },
  hate_speech: {
    label: 'Hate Speech',
    description: 'Content that promotes hatred against protected groups'
  },
  sexual_content: {
    label: 'Sexual Content',
    description: 'Content of a sexual nature'
  },
  dangerous_content: {
    label: 'Dangerous Content',
    description: 'Content that promotes dangerous or illegal activities'
  }
};

/**
 * Safety threshold options with descriptions
 */
const SAFETY_THRESHOLDS = {
  HARM_BLOCK_NONE: { label: 'None', description: 'Allow all content' },
  HARM_BLOCK_ONLY_HIGH: { label: 'High Only', description: 'Block only high-risk content' },
  HARM_BLOCK_MEDIUM_AND_ABOVE: { label: 'Medium+', description: 'Block medium and high-risk content' },
  HARM_BLOCK_LOW_AND_ABOVE: { label: 'Low+', description: 'Block low, medium, and high-risk content' }
};

/**
 * Google Gemini-specific settings component
 * Renders configuration options specific to Gemini models with advanced features
 */
const GoogleSettings: React.FC<ProviderSettingsProps> = ({
  apiKey,
  onApiKeyChange,
  onValidate,
  validationStatus,
  validationError,
  isValidating,
  onSetupComplete,
  provider,
  config
}) => {
  // Parameter settings state
  const [parameters, setParameters] = useState<GeminiParameters>({
    temperature: GEMINI_CONSTRAINTS.temperature.default,
    top_p: GEMINI_CONSTRAINTS.top_p.default,
    top_k: GEMINI_CONSTRAINTS.top_k.default,
    max_tokens: GEMINI_CONSTRAINTS.max_tokens.default,
    thinking_budget: GEMINI_CONSTRAINTS.thinking_budget.default,
    safety_settings: {
      harmful_content: 'HARM_BLOCK_MEDIUM_AND_ABOVE',
      harassment: 'HARM_BLOCK_MEDIUM_AND_ABOVE',
      hate_speech: 'HARM_BLOCK_MEDIUM_AND_ABOVE',
      sexual_content: 'HARM_BLOCK_MEDIUM_AND_ABOVE',
      dangerous_content: 'HARM_BLOCK_MEDIUM_AND_ABOVE'
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSafetySettings, setShowSafetySettings] = useState(false);
  const [parameterErrors, setParameterErrors] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  // Initialize parameters and models from config when available
  useEffect(() => {
    if (config && typeof config === 'object') {
      // Update parameters from config defaults
      if (config.defaultParameters) {
        setParameters(prev => ({ ...prev, ...config.defaultParameters }));
      }
      
      // Set available models
      if (config.models && Array.isArray(config.models)) {
        setAvailableModels(config.models);
        if (config.models.length > 0 && !selectedModel) {
          setSelectedModel(config.models[0].id);
        }
      }
    }
  }, [config]);

  // Check if current model supports thinking budget
  const supportsThinkingBudget = useCallback((modelId: string) => {
    return THINKING_CAPABLE_MODELS.some(pattern => 
      modelId.toLowerCase().includes(pattern.toLowerCase())
    );
  }, []);

  const currentModelSupportsThinking = supportsThinkingBudget(selectedModel);

  // Debounced parameter update to avoid excessive calls
  const debouncedParameterUpdate = useCallback(
    debounce((newParams: GeminiParameters) => {
      // Validate parameters
      const errors: Record<string, string> = {};
      
      Object.entries(GEMINI_CONSTRAINTS).forEach(([key, constraint]) => {
        const value = newParams[key as keyof GeminiParameters] as number;
        if (typeof value === 'number' && (value < constraint.min || value > constraint.max)) {
          errors[key] = `${key} must be between ${constraint.min} and ${constraint.max}`;
        }
      });
      
      setParameterErrors(errors);
      
      // Call parent update if valid
      if (Object.keys(errors).length === 0) {
        console.log('Updated Gemini parameters:', newParams);
      }
    }, 300),
    []
  );

  // Handle parameter changes
  const handleParameterChange = (key: keyof GeminiParameters, value: number | string | GeminiSafetySettings) => {
    const newParameters = {
      ...parameters,
      [key]: value,
    };
    setParameters(newParameters);
    debouncedParameterUpdate(newParameters);
  };

  // Handle safety setting changes
  const handleSafetySettingChange = (category: keyof GeminiSafetySettings, threshold: GeminiSafetyThreshold) => {
    const newSafetySettings = {
      ...parameters.safety_settings!,
      [category]: threshold
    };
    handleParameterChange('safety_settings', newSafetySettings);
  };

  // Handle model selection change
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    
    // Update max_tokens constraint based on model context length
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      const maxTokens = Math.min(model.contextLength / 2, 8192);
      if (parameters.max_tokens > maxTokens) {
        handleParameterChange('max_tokens', maxTokens);
      }
    }
  };

  // Render parameter control with advanced UI patterns
  const renderParameterControl = (key: keyof typeof GEMINI_CONSTRAINTS, label: string, description: string, showThinking = false) => {
    const constraint = GEMINI_CONSTRAINTS[key];
    const currentValue = parameters[key] as number;
    const hasError = parameterErrors[key];

    // Special handling for thinking budget
    if (key === 'thinking_budget' && !currentModelSupportsThinking) {
      return null;
    }

    return (
      <div key={key} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-text-primary">
              {label}
              {showThinking && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Thinking Models
                </span>
              )}
            </label>
            <div className="group relative">
              <button className="text-text-tertiary hover:text-text-secondary" type="button">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                {description}
                {key === 'thinking_budget' && (
                  <div className="mt-2 space-y-1">
                    <div><strong>-1:</strong> Dynamic thinking (recommended)</div>
                    <div><strong>0:</strong> Disable thinking</div>
                    <div><strong>1-10000:</strong> Token limit for thinking</div>
                  </div>
                )}
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
      {/* Google-specific Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Google Gemini Configuration
        </h3>
        <p className="text-sm text-blue-700">
          Configure your Google AI Studio API access for Gemini models.
          Gemini offers powerful multimodal capabilities with fast response times and advanced thinking features.
        </p>
      </div>

      {/* API Key Input */}
      <div>
        <label htmlFor="google-api-key" className="block text-sm font-medium text-text-primary mb-2">
          Google AI Studio API Key
        </label>
        <input
          type="password"
          id="google-api-key"
          name="google-api-key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="AIza..."
          className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
        />
        <p className="mt-2 text-sm text-text-tertiary">
          Get your API key from{' '}
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            Google AI Studio
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
            {isValidating ? 'Validating...' : 'Validate Google API Key'}
          </span>
        </button>
      </div>

      {/* Validation Status */}
      {validationStatus !== 'idle' && (
        <div className="space-y-2">
          {validationStatus === 'valid' && (
            <div className="flex items-center space-x-2 text-green-600">
              <span className="w-5 h-5">✓</span>
              <span className="font-medium">Google API key validated successfully</span>
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
            {/* Model Selection */}
            {availableModels.length > 0 && (
              <div className="mb-6">
                <label htmlFor="model-select" className="block text-sm font-medium text-text-primary mb-2">
                  Select Gemini Model
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {supportsThinkingBudget(model.id) && '(Thinking Capable)'}
                    </option>
                  ))}
                </select>
                {selectedModel && (
                  <p className="mt-2 text-sm text-text-tertiary">
                    {availableModels.find(m => m.id === selectedModel)?.description}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-text-primary">Model Parameters</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Configure how Gemini generates responses
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
              {renderParameterControl('temperature', 'Temperature', 'Controls randomness in generation. Higher values (0.8-2.0) produce more creative but less predictable responses. Note: Gemini supports up to 2.0 (different from Anthropic).')}
              {renderParameterControl('max_tokens', 'Max Tokens', 'Maximum number of tokens to generate in the response. Higher values allow longer responses but cost more.')}
            </div>

            {/* Advanced Parameters */}
            {showAdvanced && (
              <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-text-primary mb-4">Advanced Parameters</h4>
                {renderParameterControl('top_p', 'Top P (Nucleus Sampling)', 'Controls diversity via nucleus sampling. Lower values (0.1-0.5) focus on more likely tokens.')}
                {renderParameterControl('top_k', 'Top K', 'Limits the number of highest probability vocabulary tokens to consider (1-40 for Gemini). Lower values increase focus.')}
                
                {/* Thinking Budget - Only for capable models */}
                {currentModelSupportsThinking && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h5 className="text-sm font-medium text-blue-800">Thinking Budget (Advanced Feature)</h5>
                    </div>
                    <p className="text-xs text-blue-700 mb-4">
                      This model supports "thinking" - internal reasoning before generating the final response.
                      This feature allows the model to work through complex problems step by step.
                    </p>
                    {renderParameterControl('thinking_budget', 'Thinking Budget', 'Controls the thinking behavior. -1 for dynamic thinking (recommended), 0 to disable thinking, or set a token limit for thinking process.', true)}
                  </div>
                )}
              </div>
            )}

            {/* Safety Settings Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-md font-medium text-text-primary">Safety Settings</h4>
                  <p className="text-sm text-text-secondary mt-1">
                    Configure content safety thresholds for each category
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSafetySettings(!showSafetySettings)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showSafetySettings ? 'Hide Safety Settings' : 'Show Safety Settings'}
                </button>
              </div>

              {showSafetySettings && (
                <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  {Object.entries(SAFETY_CATEGORIES).map(([category, info]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-text-primary">
                          {info.label}
                        </label>
                        <div className="group relative">
                          <button className="text-text-tertiary hover:text-text-secondary" type="button">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                            {info.description}
                          </div>
                        </div>
                      </div>
                      <select
                        value={parameters.safety_settings?.[category as keyof GeminiSafetySettings] || 'HARM_BLOCK_MEDIUM_AND_ABOVE'}
                        onChange={(e) => handleSafetySettingChange(category as keyof GeminiSafetySettings, e.target.value as GeminiSafetyThreshold)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.entries(SAFETY_THRESHOLDS).map(([threshold, thresholdInfo]) => (
                          <option key={threshold} value={threshold}>
                            {thresholdInfo.label} - {thresholdInfo.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-xs font-medium text-yellow-800">Safety Settings Note</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          These settings control Google's safety filters. More restrictive settings may block legitimate content.
                          Consider your use case when adjusting these thresholds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gemini Features Info - Only show before validation */}
      {validationStatus !== 'valid' && (
        <div>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-primary">
              Gemini Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-text-secondary">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Multimodal understanding</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Fast inference speed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Code generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Large context windows</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Thinking capabilities (2.5+ models)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Advanced safety controls</span>
              </div>
            </div>
          </div>

          {/* Available Models Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mt-6">
            <h4 className="text-sm font-medium text-gray-800 mb-2">
              Available Gemini Models
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>Gemini 2.5 Flash:</strong> Latest fast model with thinking capabilities</div>
              <div><strong>Gemini 2.5 Pro:</strong> Most capable model with advanced thinking features</div>
              <div><strong>Gemini 1.5 Flash:</strong> Fast, versatile performance across a diverse variety of tasks</div>
              <div><strong>Gemini 1.5 Pro:</strong> Mid-size multimodal model that supports up to 1 million tokens</div>
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

export default GoogleSettings;