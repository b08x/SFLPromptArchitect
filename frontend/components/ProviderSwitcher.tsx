/**
 * @file ProviderSwitcher.tsx
 * @description This component provides dynamic AI provider switching functionality.
 * It allows users to quickly switch between configured providers, select models,
 * and adjust parameters in real-time without needing to navigate to settings.
 *
 * @requires react
 * @requires ../types/aiProvider
 * @requires ../config/modelCapabilities
 */

import React, { useState, useEffect } from 'react';
import { AIProvider, ActiveProviderConfig, ModelParameters } from '../types/aiProvider';
import { PROVIDER_CONFIGS, getProviderModels, getParameterConstraints } from '../config/modelCapabilities';
import CogIcon from './icons/CogIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';

/**
 * @interface ProviderSwitcherProps
 * @description Defines the props for the ProviderSwitcher component.
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
 * A compact component for switching AI providers and configuring parameters
 * at runtime. Designed to be embedded in other interfaces where quick
 * provider switching is needed.
 *
 * @param {ProviderSwitcherProps} props - The component props
 * @returns {JSX.Element} The rendered provider switcher
 */
const ProviderSwitcher: React.FC<ProviderSwitcherProps> = ({
  currentConfig,
  onConfigChange,
  compact = false,
  showAdvanced = false
}) => {
  // Local state for UI management
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [parameterConstraints, setParameterConstraints] = useState<any>({});
  const [hasValidApiKey, setHasValidApiKey] = useState(false);

  // Load available models when provider changes
  useEffect(() => {
    const models = getProviderModels(currentConfig.provider);
    setAvailableModels(models.map(model => model.id));
    
    // Update parameter constraints for current model
    const constraints = getParameterConstraints(currentConfig.provider, currentConfig.model);
    setParameterConstraints(constraints);
  }, [currentConfig.provider, currentConfig.model]);

  // Check if API key is configured for the current provider
  useEffect(() => {
    const hasKey = Boolean(currentConfig.apiKey);
    setHasValidApiKey(hasKey);
  }, [currentConfig.apiKey, currentConfig.provider]);

  /**
   * Handle provider change
   */
  const handleProviderChange = (newProvider: AIProvider) => {
    const providerConfig = PROVIDER_CONFIGS[newProvider];
    const firstModel = providerConfig.models[0];
    
    // Load API key from localStorage
    const savedApiKey = localStorage.getItem(`sfl-api-key-${newProvider}`) || '';
    
    const newConfig: ActiveProviderConfig = {
      provider: newProvider,
      model: firstModel.id,
      parameters: providerConfig.defaultParameters,
      apiKey: savedApiKey,
      baseUrl: providerConfig.baseUrl
    };
    
    onConfigChange(newConfig);
  };

  /**
   * Handle model change
   */
  const handleModelChange = (modelId: string) => {
    const providerConfig = PROVIDER_CONFIGS[currentConfig.provider];
    const newConfig: ActiveProviderConfig = {
      ...currentConfig,
      model: modelId,
      parameters: providerConfig.defaultParameters
    };
    
    onConfigChange(newConfig);
  };

  /**
   * Handle parameter change
   */
  const handleParameterChange = (paramName: string, value: number | string) => {
    const newParameters = {
      ...currentConfig.parameters,
      [paramName]: value
    };
    
    const newConfig: ActiveProviderConfig = {
      ...currentConfig,
      parameters: newParameters
    };
    
    onConfigChange(newConfig);
  };

  /**
   * Render parameter control for a specific parameter
   */
  const renderParameterControl = (paramName: string, constraint: any) => {
    const currentValue = (currentConfig.parameters as any)[paramName] ?? constraint.default;
    
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
  };

  const currentProviderConfig = PROVIDER_CONFIGS[currentConfig.provider];

  if (compact && !isExpanded) {
    return (
      <div className="flex items-center space-x-2 bg-[#333e48] px-3 py-2 rounded-lg border border-[#5c6f7e]">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${hasValidApiKey ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-200 font-medium">
            {currentProviderConfig.name}
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

      {/* Provider Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-[#95aac0]">Provider</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((provider) => {
            const config = PROVIDER_CONFIGS[provider];
            const isSelected = currentConfig.provider === provider;
            const hasKey = Boolean(localStorage.getItem(`sfl-api-key-${provider}`));
            
            return (
              <button
                key={provider}
                onClick={() => handleProviderChange(provider)}
                className={`flex items-center space-x-2 p-2 rounded border text-left transition-colors ${
                  isSelected
                    ? 'border-[#e2a32d] bg-[#e2a32d] bg-opacity-10'
                    : 'border-[#5c6f7e] hover:border-[#95aac0]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-200">{config.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Key Status */}
      {!hasValidApiKey && (
        <div className="flex items-center space-x-2 p-2 bg-red-900 bg-opacity-20 border border-red-500 rounded">
          <XCircleIcon className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-400">
            API key not configured. Visit Settings to configure.
          </span>
        </div>
      )}

      {/* Model Selection */}
      {hasValidApiKey && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#95aac0]">Model</label>
          <select
            value={currentConfig.model}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded text-sm focus:border-[#e2a32d] focus:outline-none"
          >
            {availableModels.map((modelId) => {
              const modelInfo = getProviderModels(currentConfig.provider).find(m => m.id === modelId);
              return (
                <option key={modelId} value={modelId}>
                  {modelInfo?.name || modelId}
                </option>
              );
            })}
          </select>
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
      {hasValidApiKey && showAdvanced && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#95aac0]">Quick Presets</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleParameterChange('temperature', 0.2)}
              className="px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
            >
              Precise
            </button>
            <button
              onClick={() => {
                const defaultParams = currentProviderConfig.defaultParameters;
                Object.entries(defaultParams).forEach(([key, value]) => {
                  if (typeof value === 'number') {
                    handleParameterChange(key, value);
                  }
                });
              }}
              className="px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
            >
              Balanced
            </button>
            <button
              onClick={() => {
                const constraint = parameterConstraints.temperature;
                if (constraint) {
                  handleParameterChange('temperature', Math.min(1.5, constraint.max));
                }
              }}
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