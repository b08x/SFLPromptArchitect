/**
 * @file ProviderStatus.tsx
 * @description Simple status component to test the new provider store
 * Shows current provider state and allows basic testing
 */

import React from 'react';
import { 
  useActiveProvider, 
  useConfiguredProviders, 
  useProviderReady, 
  useProviderError,
  useProviderLoading
} from '../store/providerStore';

const ProviderStatus: React.FC = () => {
  const activeConfig = useActiveProvider();
  const configuredProviders = useConfiguredProviders();
  const { isReady, requiresSetup } = useProviderReady();
  const error = useProviderError();
  const { isLoading, isValidating } = useProviderLoading();

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
      <h3 className="font-medium text-gray-900 mb-3">Provider Store Status</h3>
      
      <div className="space-y-2">
        <div>
          <span className="font-medium text-gray-700">Ready: </span>
          <span className={isReady ? 'text-green-600' : 'text-red-600'}>
            {isReady ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-medium text-gray-700">Requires Setup: </span>
          <span className={requiresSetup ? 'text-orange-600' : 'text-green-600'}>
            {requiresSetup ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-medium text-gray-700">Loading: </span>
          <span className={isLoading ? 'text-blue-600' : 'text-gray-500'}>
            {isLoading ? 'Yes' : 'No'}
          </span>
        </div>

        {error && (
          <div>
            <span className="font-medium text-red-700">Error: </span>
            <span className="text-red-600">{error}</span>
          </div>
        )}
        
        <div>
          <span className="font-medium text-gray-700">Configured Providers: </span>
          <span className="text-gray-600">
            {configuredProviders.length > 0 ? configuredProviders.join(', ') : 'None'}
          </span>
        </div>
        
        {activeConfig && (
          <div>
            <span className="font-medium text-gray-700">Active: </span>
            <span className="text-gray-600">
              {activeConfig.provider} / {activeConfig.model}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderStatus;