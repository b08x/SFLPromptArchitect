/**
 * @file ProviderSwitcher.tsx
 * @description Self-contained AI provider switching component using Zustand store.
 * Provides runtime provider switching without client-side API key storage.
 * 
 * SECURITY FEATURES:
 * - NO client-side API key storage or handling
 * - Dynamic provider/model fetching from backend
 * - Session-based secure API key management
 * - Supports all 8 AI providers through backend proxy
 *
 * @requires react
 * @requires ../store/providerStore
 * @requires ../types/aiProvider
 */

import React, { useState } from 'react';
import { AIProvider } from '../types/aiProvider';
import { 
  useProviderStore, 
  useActiveProvider, 
  useConfiguredProviders, 
  useAvailableModels,
  useModelConstraints,
  useProviderError,
  useProviderLoading
} from '../store/providerStore';
import CogIcon from './icons/CogIcon';
import XCircleIcon from './icons/XCircleIcon';

interface ProviderSwitcherProps {
  compact?: boolean;
  showAdvanced?: boolean;
}

const ProviderSwitcher: React.FC<ProviderSwitcherProps> = ({
  compact = false,
  showAdvanced = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  // Store selectors
  const { setActiveProvider, setActiveModel, updateParameters, availableProviders } = useProviderStore();
  const activeConfig = useActiveProvider();
  const configuredProviders = useConfiguredProviders();
  const availableModels = useAvailableModels();
  const constraints = useModelConstraints();
  const error = useProviderError();
  const { isLoading } = useProviderLoading();

  // Get list of all available providers from the store
  const availableProvidersList = Object.keys(availableProviders) as AIProvider[];

  const handleProviderChange = async (newProvider: AIProvider) => {
    await setActiveProvider(newProvider);
  };

  const handleModelChange = (modelId: string) => {
    setActiveModel(modelId);
  };

  const handleParameterChange = (param: string, value: any) => {
    updateParameters({ [param]: value });
  };

  if (!activeConfig) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
          <div className="text-sm text-red-700">
            No provider configured. Please configure a provider in Settings.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          {compact ? 'AI Provider' : 'AI Provider Configuration'}
        </h3>
        {compact && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            <CogIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {(!compact || isExpanded) && (
        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={activeConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isLoading}
            >
              {availableProvidersList.map(provider => {
                const isConfigured = configuredProviders.includes(provider);
                return (
                  <option key={provider} value={provider} disabled={!isConfigured}>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)} {!isConfigured && '(Not Configured)'}
                  </option>
                );
              })}
            </select>
            
            {/* Provider Status */}
            <div className="mt-2 flex items-center text-xs">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                configuredProviders.includes(activeConfig.provider) ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className={configuredProviders.includes(activeConfig.provider) ? 'text-green-600' : 'text-red-600'}>
                {configuredProviders.includes(activeConfig.provider) ? 'Connected' : 'API key not configured'}
              </span>
            </div>
          </div>

          {/* Model Selection */}
          {availableModels.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={activeConfig.model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isLoading}
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name || model.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Advanced Parameters */}
          {showAdvanced && Object.keys(constraints).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-xs font-medium text-gray-700 mb-3">Model Parameters</h4>
              <div className="space-y-3">
                {Object.entries(constraints).map(([param, constraint]) => (
                  <div key={param}>
                    <label className="block text-xs text-gray-600 mb-1 capitalize">
                      {param.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </label>
                    <input
                      type="number"
                      min={constraint.min}
                      max={constraint.max}
                      step={constraint.step || 0.01}
                      defaultValue={constraint.default}
                      onChange={(e) => handleParameterChange(param, parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderSwitcher;