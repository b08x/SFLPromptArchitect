/**
 * @file ProviderSwitcher.tsx
 * @description Secure dynamic AI provider switching component with backend integration.
 * Provides runtime provider switching without client-side API key storage.
 * 
 * SECURITY FEATURES:
 * - NO client-side API key storage or handling
 * - Dynamic provider/model fetching from backend
 * - Session-based secure API key management
 * - Supports all 8 AI providers through backend proxy
 *
 * @requires react
 * @requires ../services/providerService
 * @requires ../types/aiProvider
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AIProvider, 
  ActiveProviderConfig, 
  ModelParameters,
} from '../types/aiProvider';
import { 
  getProviderConfigurations,
  getProviderConfiguration,
  getStoredProviders,
  ProviderData,
  ProviderConfig,
  ModelInfo,
} from '../services/providerService';
import CogIcon from './icons/CogIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';

/**
 * Props interface for the secure ProviderSwitcher component
 */
interface ProviderSwitcherProps {
  /** Current active provider configuration */
  currentConfig: ActiveProviderConfig;
  /** Callback when provider configuration changes */
  onConfigChange: (config: ActiveProviderConfig) => void;
  /** Whether the switcher is in compact mode */
  compact?: boolean;
  /** Whether to show advanced parameters */
  showAdvanced?: boolean;
}

/**
 * Loading states for async operations
 */
interface LoadingState {
  providers: boolean;
  models: boolean;
  validation: boolean;
}

/**
 * Error states for better UX
 */
interface ErrorState {
  providers?: string;
  models?: string;
  validation?: string;
}

/**
 * Secure provider switcher component that integrates with backend API
 * for dynamic provider/model management without client-side secrets.
 */
const ProviderSwitcher: React.FC<ProviderSwitcherProps> = ({
  currentConfig,
  onConfigChange,
  compact = false,
  showAdvanced = false
}) => {
  // Component state
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [availableProviders, setAvailableProviders] = useState<ProviderData[]>([]);
  const [currentProviderConfig, setCurrentProviderConfig] = useState<ProviderConfig | null>(null);
  const [storedProviders, setStoredProviders] = useState<AIProvider[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState<LoadingState>({
    providers: true,
    models: false,
    validation: false,
  });
  
  const [errors, setErrors] = useState<ErrorState>({});

  // Memoized values for performance
  const availableModels = useMemo(() => {
    return currentProviderConfig?.models || [];
  }, [currentProviderConfig]);

  const parameterConstraints = useMemo(() => {
    if (!currentProviderConfig || !currentConfig.model) return {};
    
    const model = currentProviderConfig.models.find(m => m.id === currentConfig.model);
    return model?.constraints || {};
  }, [currentProviderConfig, currentConfig.model]);

  const hasValidApiKey = useMemo(() => {
    return storedProviders.includes(currentConfig.provider);
  }, [storedProviders, currentConfig.provider]);

  /**
   * Load initial provider data from backend
   */
  const loadProviders = useCallback(async (retryAttempt = 0) => {
    try {
      setLoading(prev => ({ ...prev, providers: true }));
      setErrors(prev => ({ ...prev, providers: undefined }));
      
      // Load provider configurations and stored keys
      const [providerData, storedData] = await Promise.all([
        getProviderConfigurations(),
        getStoredProviders()
      ]);
      
      setAvailableProviders(providerData);
      setStoredProviders(storedData.providers || []);
      
    } catch (error) {
      console.error('Error loading providers:', error);
      
      // Enhanced error handling with retry logic
      const errorMessage = error instanceof Error ? error.message : 'Failed to load providers';
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('Network');
      
      // Auto-retry network errors up to 2 times
      if (isNetworkError && retryAttempt < 2) {
        console.log(`Retrying provider load (attempt ${retryAttempt + 1}/2)...`);
        setTimeout(() => loadProviders(retryAttempt + 1), 1000 * (retryAttempt + 1));
        return;
      }
      
      setErrors(prev => ({
        ...prev,
        providers: `${errorMessage}${isNetworkError ? ' (Auto-retry failed)' : ''}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, providers: false }));
    }
  }, []);

  /**
   * Load configuration for a specific provider
   */
  const loadProviderConfig = useCallback(async (provider: AIProvider, retryAttempt = 0) => {
    try {
      setLoading(prev => ({ ...prev, models: true }));
      setErrors(prev => ({ ...prev, models: undefined }));
      
      // First try to use the config already loaded in availableProviders
      const existingProviderData = availableProviders.find(p => p.provider === provider);
      if (existingProviderData?.config) {
        setCurrentProviderConfig(existingProviderData.config);
        setLoading(prev => ({ ...prev, models: false }));
        return;
      }
      
      // Fallback to API call if config not available
      const config = await getProviderConfiguration(provider);
      setCurrentProviderConfig(config);
      
    } catch (error) {
      console.error('Error loading provider config:', error);
      
      // Enhanced error handling with retry logic for model loading
      const errorMessage = error instanceof Error ? error.message : 'Failed to load models';
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('Network');
      
      // Auto-retry network errors up to 2 times
      if (isNetworkError && retryAttempt < 2) {
        console.log(`Retrying model load for ${provider} (attempt ${retryAttempt + 1}/2)...`);
        setTimeout(() => loadProviderConfig(provider, retryAttempt + 1), 1000 * (retryAttempt + 1));
        return;
      }
      
      setErrors(prev => ({
        ...prev,
        models: `${errorMessage}${isNetworkError ? ' (Auto-retry failed)' : ''}`
      }));
      setCurrentProviderConfig(null);
    } finally {
      setLoading(prev => ({ ...prev, models: false }));
    }
  }, [availableProviders]);

  /**
   * Initial load and provider change effects
   */
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    loadProviderConfig(currentConfig.provider);
  }, [currentConfig.provider, loadProviderConfig]);

  /**
   * Handle provider change with secure backend integration
   */
  const handleProviderChange = useCallback(async (newProvider: AIProvider) => {
    try {
      const config = await getProviderConfiguration(newProvider);
      const firstModel = config.models[0];
      
      if (!firstModel) {
        throw new Error(`No models available for provider ${newProvider}`);
      }
      
      const newConfig: ActiveProviderConfig = {
        provider: newProvider,
        model: firstModel.id,
        parameters: config.defaultParameters,
        apiKey: '', // API keys are managed server-side
        baseUrl: config.baseUrl
      };
      
      onConfigChange(newConfig);
      
    } catch (error) {
      console.error('Error changing provider:', error);
      setErrors(prev => ({
        ...prev,
        validation: error instanceof Error ? error.message : 'Failed to change provider'
      }));
    }
  }, [onConfigChange]);

  /**
   * Handle model change
   */
  const handleModelChange = useCallback((modelId: string) => {
    if (!currentProviderConfig) return;
    
    const newConfig: ActiveProviderConfig = {
      ...currentConfig,
      model: modelId,
      parameters: currentProviderConfig.defaultParameters
    };
    
    onConfigChange(newConfig);
  }, [currentConfig, currentProviderConfig, onConfigChange]);

  /**
   * Handle parameter change
   */
  const handleParameterChange = useCallback((paramName: string, value: number | string | boolean) => {
    const newParameters = {
      ...currentConfig.parameters,
      [paramName]: value
    };
    
    const newConfig: ActiveProviderConfig = {
      ...currentConfig,
      parameters: newParameters
    };
    
    onConfigChange(newConfig);
  }, [currentConfig, onConfigChange]);

  /**
   * Apply parameter preset
   */
  const applyParameterPreset = useCallback((presetType: 'precise' | 'balanced' | 'creative') => {
    if (!currentProviderConfig) return;
    
    const baseTemp = currentProviderConfig.defaultParameters.temperature || 1.0;
    const constraint = parameterConstraints.temperature;
    
    let temperature = baseTemp;
    
    switch (presetType) {
      case 'precise':
        temperature = 0.2;
        break;
      case 'balanced':
        temperature = baseTemp;
        break;
      case 'creative':
        temperature = constraint ? Math.min(1.5, constraint.max) : 1.5;
        break;
    }
    
    handleParameterChange('temperature', temperature);
  }, [currentProviderConfig, parameterConstraints.temperature, handleParameterChange]);

  /**
   * Render parameter control for a specific parameter
   */
  const renderParameterControl = useCallback((paramName: string, constraint: any) => {
    const currentValue = (currentConfig.parameters as any)[paramName] ?? constraint.default;
    
    // Handle boolean parameters
    if (typeof constraint.default === 'boolean') {
      return (
        <div key={paramName} className="space-y-1">
          <label className="block text-xs font-medium text-[#95aac0] capitalize">
            {paramName.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={currentValue}
              onChange={(e) => handleParameterChange(paramName, e.target.checked)}
              className="form-checkbox h-4 w-4 text-[#e2a32d] bg-[#212934] border-[#5c6f7e] rounded focus:border-[#e2a32d]"
            />
            <span className="text-xs text-[#95aac0]">
              {currentValue ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      );
    }
    
    // Handle numeric parameters
    return (
      <div key={paramName} className="space-y-1">
        <label className="block text-xs font-medium text-[#95aac0] capitalize">
          {paramName.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min={constraint.min}
            max={constraint.max}
            step={constraint.step}
            value={currentValue}
            onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
            className="flex-1 h-1 bg-[#5c6f7e] rounded-lg appearance-none cursor-pointer slider"
          />
          <input
            type="number"
            min={constraint.min}
            max={constraint.max}
            step={constraint.step}
            value={currentValue}
            onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
            className="w-16 px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 focus:border-[#e2a32d]"
          />
        </div>
      </div>
    );
  }, [currentConfig.parameters, handleParameterChange]);

  /**
   * Render compact view
   */
  if (compact && !isExpanded) {
    const providerData = availableProviders.find(p => p.provider === currentConfig.provider);
    const providerName = providerData?.provider || currentConfig.provider;
    
    return (
      <div className="flex items-center space-x-2 bg-[#333e48] px-3 py-2 rounded-lg border border-[#5c6f7e]">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${hasValidApiKey ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-200 font-medium capitalize">
            {providerName}
          </span>
        </div>
        <div className="text-xs text-[#95aac0]">
          {currentConfig.model}
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="p-1 hover:bg-[#5c6f7e] rounded transition-colors"
        >
          <CogIcon className="w-4 h-4 text-[#95aac0]" />
        </button>
      </div>
    );
  }

  /**
   * Render full expanded view
   */
  return (
    <div className="bg-[#333e48] border border-[#5c6f7e] rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ArrowsRightLeftIcon className="w-5 h-5 text-[#e2a32d]" />
          <h3 className="text-sm font-semibold text-[#e2a32d]">AI Provider</h3>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-[#5c6f7e] rounded transition-colors"
          >
            <XCircleIcon className="w-4 h-4 text-[#95aac0]" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading.providers && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#e2a32d]"></div>
          <span className="ml-2 text-sm text-[#95aac0]">Loading providers...</span>
        </div>
      )}

      {/* Error State */}
      {errors.providers && (
        <div className="p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded space-y-2">
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-400 font-medium">Provider Loading Error</span>
          </div>
          <p className="text-xs text-red-300">{errors.providers}</p>
          <div className="flex space-x-2">
            <button
              onClick={() => loadProviders(0)}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-1 text-xs border border-red-500 text-red-400 rounded hover:bg-red-900 hover:bg-opacity-30 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      {!loading.providers && !errors.providers && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#95aac0]">Provider</label>
          <div className="grid grid-cols-2 gap-2">
            {availableProviders.map((providerData) => {
              const isSelected = currentConfig.provider === providerData.provider;
              const hasKey = storedProviders.includes(providerData.provider);
              
              return (
                <button
                  key={providerData.provider}
                  onClick={() => handleProviderChange(providerData.provider)}
                  className={`flex items-center space-x-2 p-2 rounded border text-left transition-colors ${
                    isSelected
                      ? 'border-[#e2a32d] bg-[#e2a32d] bg-opacity-10'
                      : 'border-[#5c6f7e] hover:border-[#95aac0]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-200 capitalize">
                    {providerData.provider}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* API Key Status */}
      {!hasValidApiKey && !loading.providers && (
        <div className="flex items-center space-x-2 p-2 bg-red-900 bg-opacity-20 border border-red-500 rounded">
          <XCircleIcon className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-400">
            API key not configured. Visit Settings to configure.
          </span>
        </div>
      )}

      {/* Model Selection */}
      {hasValidApiKey && !loading.models && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#95aac0]">Model</label>
          {errors.models ? (
            <div className="p-2 bg-red-900 bg-opacity-20 border border-red-500 rounded space-y-1">
              <div className="flex items-center space-x-1">
                <XCircleIcon className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-400 font-medium">Model Loading Error</span>
              </div>
              <p className="text-xs text-red-300">{errors.models}</p>
              <button
                onClick={() => loadProviderConfig(currentConfig.provider, 0)}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry Models
              </button>
            </div>
          ) : (
            <select
              value={currentConfig.model}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded text-sm focus:border-[#e2a32d] focus:outline-none"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Parameters */}
      {hasValidApiKey && showAdvanced && Object.keys(parameterConstraints).length > 0 && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-[#95aac0]">Parameters</label>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(parameterConstraints).map(([paramName, constraint]) =>
              renderParameterControl(paramName, constraint)
            )}
          </div>
        </div>
      )}

      {/* Quick Parameter Presets */}
      {hasValidApiKey && showAdvanced && parameterConstraints.temperature && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#95aac0]">Quick Presets</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => applyParameterPreset('precise')}
              className="px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
            >
              Precise
            </button>
            <button
              onClick={() => applyParameterPreset('balanced')}
              className="px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
            >
              Balanced
            </button>
            <button
              onClick={() => applyParameterPreset('creative')}
              className="px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
            >
              Creative
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderSwitcher;