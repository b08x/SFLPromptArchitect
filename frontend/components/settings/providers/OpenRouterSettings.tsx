/**
 * @file OpenRouterSettings.tsx
 * @description Provider-specific settings component for OpenRouter and Groq.
 * This component handles gateway provider configuration with dynamic model selection,
 * API key management, and provider-specific parameters.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProviderSettingsProps } from './types';
import { getProviderConfiguration } from '../../../services/providerService';
import { ModelInfo } from '../../../types/aiProvider';

/**
 * Gateway provider parameters (OpenRouter/Groq)
 */
interface GatewayParameters {
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  selectedModel?: string;
}

/**
 * Model category for UI organization
 */
interface ModelCategory {
  name: string;
  models: ModelInfo[];
  color: string;
}

/**
 * Default parameter constraints for gateway providers
 */
const DEFAULT_CONSTRAINTS = {
  temperature: { min: 0, max: 2, step: 0.01, default: 0.7 },
  max_tokens: { min: 1, max: 8192, step: 1, default: 2048 },
  top_p: { min: 0, max: 1, step: 0.01, default: 0.9 },
  frequency_penalty: { min: -2, max: 2, step: 0.01, default: 0 },
  presence_penalty: { min: -2, max: 2, step: 0.01, default: 0 },
};

/**
 * OpenRouter/Groq-specific settings component
 * Handles both OpenRouter (extensive model catalog) and Groq (high-speed inference)
 */
const OpenRouterSettings: React.FC<ProviderSettingsProps> = ({
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
  // State management
  const [parameters, setParameters] = useState<GatewayParameters>({
    temperature: DEFAULT_CONSTRAINTS.temperature.default,
    max_tokens: DEFAULT_CONSTRAINTS.max_tokens.default,
    top_p: DEFAULT_CONSTRAINTS.top_p.default,
    frequency_penalty: DEFAULT_CONSTRAINTS.frequency_penalty.default,
    presence_penalty: DEFAULT_CONSTRAINTS.presence_penalty.default,
  });

  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [parameterErrors, setParameterErrors] = useState<Record<string, string>>({});
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  // Provider-specific configuration
  const isGroq = provider === 'groq';
  const providerName = isGroq ? 'Groq' : 'OpenRouter';
  const providerColor = isGroq ? 'orange' : 'purple';
  
  const apiKeyPlaceholder = isGroq ? 'gsk_...' : 'sk-or-v1-...';
  const apiKeyUrl = isGroq ? 'https://console.groq.com/keys' : 'https://openrouter.ai/keys';

  // Initialize parameters from config
  useEffect(() => {
    if (config && typeof config === 'object') {
      setParameters(prev => ({ ...prev, ...config }));
    }
  }, [config]);

  // Load available models when component mounts or provider changes
  useEffect(() => {
    if (validationStatus === 'valid') {
      loadAvailableModels();
    }
  }, [provider, validationStatus]);

  // Load available models from backend
  const loadAvailableModels = async () => {
    setIsLoadingModels(true);
    setModelLoadError(null);
    
    try {
      const providerConfig = await getProviderConfiguration(provider);
      setAvailableModels(providerConfig.models || []);
      
      // Set default model if none selected
      if (!parameters.selectedModel && providerConfig.models.length > 0) {
        setParameters(prev => ({ 
          ...prev, 
          selectedModel: providerConfig.models[0].id 
        }));
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setModelLoadError('Failed to load available models. Using fallback options.');
      // Provide fallback models
      setAvailableModels(getFallbackModels());
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Fallback models if API fails
  const getFallbackModels = (): ModelInfo[] => {
    if (isGroq) {
      return [
        {
          id: 'llama3-8b-8192',
          name: 'Llama 3 8B',
          provider: 'groq',
          contextLength: 8192,
          supportedParameters: ['temperature', 'max_tokens', 'top_p'],
          constraints: DEFAULT_CONSTRAINTS
        },
        {
          id: 'mixtral-8x7b-32768',
          name: 'Mixtral 8x7B',
          provider: 'groq',
          contextLength: 32768,
          supportedParameters: ['temperature', 'max_tokens', 'top_p'],
          constraints: DEFAULT_CONSTRAINTS
        }
      ];
    } else {
      return [
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'openrouter',
          contextLength: 4096,
          supportedParameters: ['temperature', 'max_tokens', 'top_p', 'frequency_penalty', 'presence_penalty'],
          constraints: DEFAULT_CONSTRAINTS
        },
        {
          id: 'claude-3-haiku',
          name: 'Claude 3 Haiku',
          provider: 'openrouter',
          contextLength: 200000,
          supportedParameters: ['temperature', 'max_tokens', 'top_p'],
          constraints: DEFAULT_CONSTRAINTS
        }
      ];
    }
  };

  // Group models by provider/category
  const modelCategories: ModelCategory[] = useMemo(() => {
    if (isGroq) {
      // Simple categorization for Groq
      return [
        {
          name: 'All Models',
          models: availableModels,
          color: 'orange'
        }
      ];
    }

    // Complex categorization for OpenRouter
    const categories: { [key: string]: ModelInfo[] } = {};
    
    availableModels.forEach(model => {
      const modelName = model.name.toLowerCase();
      let category = 'Other';
      
      if (modelName.includes('gpt') || modelName.includes('openai')) {
        category = 'OpenAI';
      } else if (modelName.includes('claude') || modelName.includes('anthropic')) {
        category = 'Anthropic';
      } else if (modelName.includes('llama') || modelName.includes('meta')) {
        category = 'Meta';
      } else if (modelName.includes('gemini') || modelName.includes('palm') || modelName.includes('google')) {
        category = 'Google';
      } else if (modelName.includes('mistral')) {
        category = 'Mistral';
      }
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(model);
    });

    const categoryColors: { [key: string]: string } = {
      'OpenAI': 'green',
      'Anthropic': 'blue',
      'Meta': 'indigo',
      'Google': 'yellow',
      'Mistral': 'red',
      'Other': 'gray'
    };

    return Object.entries(categories).map(([name, models]) => ({
      name,
      models,
      color: categoryColors[name] || 'gray'
    }));
  }, [availableModels, isGroq]);

  // Filter models based on search and category
  const filteredModels = useMemo(() => {
    let models = availableModels;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const category = modelCategories.find(c => c.name === selectedCategory);
      models = category ? category.models : [];
    }
    
    // Filter by search term
    if (modelSearchTerm) {
      models = models.filter(model => 
        model.name.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
        model.id.toLowerCase().includes(modelSearchTerm.toLowerCase())
      );
    }
    
    return models;
  }, [availableModels, selectedCategory, modelSearchTerm, modelCategories]);

  // Get constraints for selected model
  const getModelConstraints = (parameter: string) => {
    if (parameters.selectedModel) {
      const model = availableModels.find(m => m.id === parameters.selectedModel);
      if (model && model.constraints && model.constraints[parameter]) {
        return model.constraints[parameter];
      }
    }
    return DEFAULT_CONSTRAINTS[parameter as keyof typeof DEFAULT_CONSTRAINTS];
  };

  // Debounced parameter validation
  const debouncedParameterUpdate = useCallback(
    debounce((newParams: GatewayParameters) => {
      const errors: Record<string, string> = {};
      
      Object.entries(newParams).forEach(([key, value]) => {
        if (key === 'selectedModel') return;
        
        const constraint = getModelConstraints(key);
        if (constraint && typeof value === 'number') {
          if (value < constraint.min || value > constraint.max) {
            errors[key] = `${key} must be between ${constraint.min} and ${constraint.max}`;
          }
        }
      });
      
      setParameterErrors(errors);
      
      if (Object.keys(errors).length === 0) {
        console.log('Updated gateway parameters:', newParams);
      }
    }, 300),
    [parameters.selectedModel, availableModels]
  );

  // Handle parameter changes
  const handleParameterChange = (key: keyof GatewayParameters, value: number | string) => {
    const newParameters = {
      ...parameters,
      [key]: value,
    };
    setParameters(newParameters);
    debouncedParameterUpdate(newParameters);
  };

  // Handle model selection
  const handleModelChange = (modelId: string) => {
    handleParameterChange('selectedModel', modelId);
    // Update max_tokens constraint based on model context length
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      const maxTokens = Math.min(model.contextLength, 8192);
      if (parameters.max_tokens > maxTokens) {
        handleParameterChange('max_tokens', maxTokens);
      }
    }
  };

  // Render parameter control
  const renderParameterControl = (key: keyof typeof DEFAULT_CONSTRAINTS, label: string, description: string) => {
    const constraint = getModelConstraints(key);
    const currentValue = parameters[key] as number;
    const hasError = parameterErrors[key];

    // Check if this parameter is supported by the selected model
    const selectedModel = availableModels.find(m => m.id === parameters.selectedModel);
    const isSupported = !selectedModel || selectedModel.supportedParameters.includes(key);

    if (!isSupported) return null;

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
                  : `linear-gradient(to right, #${providerColor === 'purple' ? '8b5cf6' : 'f97316'} 0%, #${providerColor === 'purple' ? '8b5cf6' : 'f97316'} ${((currentValue - constraint.min) / (constraint.max - constraint.min)) * 100}%, #e5e7eb ${((currentValue - constraint.min) / (constraint.max - constraint.min)) * 100}%, #e5e7eb 100%)`
              }}
            />
            <input
              type="number"
              min={constraint.min}
              max={constraint.max}
              step={constraint.step}
              value={currentValue}
              onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
              className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-${providerColor}-500 ${
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
          
          {hasError && (
            <p className="text-xs text-red-600 mt-1">{hasError}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Provider-specific Information */}
      <div className={`bg-${providerColor}-50 border border-${providerColor}-200 rounded-md p-4`}>
        <h3 className={`text-sm font-medium text-${providerColor}-800 mb-2`}>
          {providerName} Configuration
        </h3>
        <p className={`text-sm text-${providerColor}-700`}>
          {isGroq 
            ? 'Configure your Groq API access for high-speed inference. Groq provides ultra-fast AI completions with optimized hardware.' 
            : 'Configure your OpenRouter API access for unified model access. Access multiple AI models through a single API including GPT, Claude, and others.'
          }
        </p>
      </div>

      {/* API Key Input */}
      <div>
        <label htmlFor={`${provider}-api-key`} className="block text-sm font-medium text-text-primary mb-2">
          {providerName} API Key
        </label>
        <input
          type="password"
          id={`${provider}-api-key`}
          name={`${provider}-api-key`}
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder={apiKeyPlaceholder}
          className="w-full px-4 py-3 bg-surface border border-border-secondary rounded-md text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors"
        />
        <p className="mt-2 text-sm text-text-tertiary">
          Get your API key from{' '}
          <a
            href={apiKeyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            {providerName}
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
            {isValidating ? 'Validating...' : `Validate ${providerName} API Key`}
          </span>
        </button>
      </div>

      {/* Validation Status */}
      {validationStatus !== 'idle' && (
        <div className="space-y-2">
          {validationStatus === 'valid' && (
            <div className="flex items-center space-x-2 text-green-600">
              <span className="w-5 h-5">✓</span>
              <span className="font-medium">{providerName} API key validated successfully</span>
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

      {/* Model Selection and Parameters - Only show if API key is validated */}
      {validationStatus === 'valid' && (
        <div className="space-y-6">
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-text-primary">Model Configuration</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Select your preferred model and configure generation parameters
                </p>
              </div>
              {!isGroq && (
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`text-sm text-${providerColor}-600 hover:text-${providerColor}-800 font-medium`}
                >
                  {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                </button>
              )}
            </div>

            {/* Model Selection */}
            <div className="space-y-4">
              <div>
                <label htmlFor="model-select" className="block text-sm font-medium text-text-primary mb-2">
                  Select Model
                  {isLoadingModels && (
                    <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
                  )}
                </label>
                
                {/* Search and Category Filter for OpenRouter */}
                {!isGroq && availableModels.length > 10 && (
                  <div className="mb-4 space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelSearchTerm}
                        onChange={(e) => setModelSearchTerm(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="all">All Categories</option>
                        {modelCategories.map(category => (
                          <option key={category.name} value={category.name}>
                            {category.name} ({category.models.length})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Model Selector */}
                {isLoadingModels ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full mr-2"></div>
                    Loading available models...
                  </div>
                ) : (
                  <>
                    {modelLoadError && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">{modelLoadError}</p>
                      </div>
                    )}
                    
                    <select
                      id="model-select"
                      value={parameters.selectedModel || ''}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                    >
                      {!parameters.selectedModel && (
                        <option value="">Select a model...</option>
                      )}
                      {filteredModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} {model.contextLength && `(${model.contextLength.toLocaleString()} tokens)`}
                          {model.pricing && ` - $${model.pricing.input}/$${model.pricing.output} per 1K tokens`}
                        </option>
                      ))}
                    </select>
                    
                    {filteredModels.length === 0 && modelSearchTerm && (
                      <p className="text-sm text-gray-500 mt-2">
                        No models found matching "{modelSearchTerm}"
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Selected Model Info */}
              {parameters.selectedModel && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  {(() => {
                    const selectedModel = availableModels.find(m => m.id === parameters.selectedModel);
                    return selectedModel ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-2">
                          {selectedModel.name}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Context Length: {selectedModel.contextLength?.toLocaleString()} tokens</div>
                          {selectedModel.description && (
                            <div>Description: {selectedModel.description}</div>
                          )}
                          {selectedModel.pricing && (
                            <div>
                              Pricing: ${selectedModel.pricing.input} input / ${selectedModel.pricing.output} output per 1K tokens
                            </div>
                          )}
                          <div>
                            Supported Parameters: {selectedModel.supportedParameters.join(', ')}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()} 
                </div>
              )}
            </div>

            {/* Basic Parameters */}
            {parameters.selectedModel && (
              <div className="space-y-6 mt-6">
                <div className="space-y-6">
                  {renderParameterControl('temperature', 'Temperature', 'Controls randomness in generation. Higher values produce more creative but less predictable responses.')}
                  {renderParameterControl('max_tokens', 'Max Tokens', 'Maximum number of tokens to generate in the response. Limited by model context length.')}
                </div>

                {/* Advanced Parameters - Only for OpenRouter or when advanced is enabled */}
                {(showAdvanced || isGroq) && (
                  <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
                    {!isGroq && (
                      <h4 className="text-md font-medium text-text-primary mb-4">Advanced Parameters</h4>
                    )}
                    {renderParameterControl('top_p', 'Top P (Nucleus Sampling)', 'Controls diversity via nucleus sampling. Lower values focus on more likely tokens.')}
                    {!isGroq && renderParameterControl('frequency_penalty', 'Frequency Penalty', 'Decreases the likelihood of repeating tokens based on their frequency in the text.')}
                    {!isGroq && renderParameterControl('presence_penalty', 'Presence Penalty', 'Decreases the likelihood of repeating any token that has appeared in the text.')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provider Features Info - Only show when not validated */}
      {validationStatus !== 'valid' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text-primary">
            {providerName} Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-text-secondary">
            {isGroq ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Ultra-fast inference</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Optimized hardware acceleration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Low latency responses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>High throughput</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Unified API access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>100+ AI models</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Pay-per-use pricing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Usage analytics</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {validationStatus !== 'valid' && !isGroq && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            Credit System
          </h4>
          <p className="text-sm text-yellow-700">
            OpenRouter uses a credit-based system. Monitor your usage and add credits
            as needed. Different models have different per-token costs.
          </p>
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

export default OpenRouterSettings;