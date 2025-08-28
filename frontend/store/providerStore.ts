/**
 * @file providerStore.ts
 * @description Simplified provider state management following ARIA pattern
 * Single source of truth for all provider-related state
 * Eliminates race conditions and complex multi-layer state management
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AIProvider, ActiveProviderConfig } from '../types/aiProvider';
import { 
  getProviderConfigurations, 
  getStoredProviders, 
  saveProviderApiKey,
  checkProviderHealth,
  ProviderConfig,
  ModelInfo
} from '../services/providerService';

/**
 * Provider store state interface
 * Single source of truth for all provider state
 */
interface ProviderState {
  // Core state
  activeConfig: ActiveProviderConfig | null;
  availableProviders: Record<AIProvider, ProviderConfig>;
  configuredProviders: AIProvider[];
  
  // Loading and error states
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  
  // Initialization state
  isInitialized: boolean;
  initializationPromise: Promise<void> | null;
  
  // Computed properties
  isReady: boolean;
  requiresSetup: boolean;
  
  // Actions
  initializeProviders: () => Promise<void>;
  setActiveProvider: (provider: AIProvider, model?: string) => Promise<void>;
  setActiveModel: (modelId: string) => void;
  updateParameters: (parameters: Record<string, any>) => void;
  saveApiKey: (provider: AIProvider, apiKey: string, baseUrl?: string) => Promise<{ success: boolean; error?: string }>;
  refreshProviders: () => Promise<void>;
  reset: () => void;
}

/**
 * Default provider configuration for fallbacks
 */
const createDefaultConfig = (provider: AIProvider): ActiveProviderConfig => ({
  provider,
  model: '',
  parameters: {},
  apiKey: '',
  baseUrl: undefined,
});

/**
 * Provider store using Zustand with subscriptions for reactive updates
 * This replaces the complex multi-layer state management
 */
export const useProviderStore = create<ProviderState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    activeConfig: null,
    availableProviders: {} as Record<AIProvider, ProviderConfig>,
    configuredProviders: [],
    isLoading: false,
    isValidating: false,
    error: null,
    isInitialized: false,
    initializationPromise: null,
    isReady: false,
    requiresSetup: true,

    /**
     * Initialize providers - called on app startup
     * Loads available providers and determines which are configured
     */
    initializeProviders: async () => {
      const currentState = get();
      
      // If already initialized, return immediately
      if (currentState.isInitialized) {
        return;
      }
      
      // If initialization is in progress, wait for it to complete
      if (currentState.initializationPromise) {
        return currentState.initializationPromise;
      }
      
      // Create and store the initialization promise
      const initPromise = (async () => {
        try {
          set({ isLoading: true, error: null });
        // Load provider configurations and stored providers in parallel
        const [providerData, storedData, healthData] = await Promise.all([
          getProviderConfigurations(),
          getStoredProviders(),
          checkProviderHealth().catch(() => ({ healthy: false, preferredProvider: null, requiresSetup: true }))
        ]);

        // Build available providers map
        const availableProviders: Record<string, ProviderConfig> = {};
        providerData.forEach(data => {
          if (data.config) {
            availableProviders[data.provider] = data.config;
          }
        });

        const configuredProviders = storedData.providers || [];
        const isReady = configuredProviders.length > 0;
        
        // Set active provider to the first configured one or preferred provider
        let activeConfig: ActiveProviderConfig | null = null;
        
        if (healthData.preferredProvider && configuredProviders.includes(healthData.preferredProvider)) {
          const providerConfig = availableProviders[healthData.preferredProvider];
          if (providerConfig && providerConfig.models.length > 0) {
            activeConfig = {
              provider: healthData.preferredProvider,
              model: providerConfig.models[0].id,
              parameters: providerConfig.defaultParameters,
              apiKey: '', // Never store API keys client-side
              baseUrl: providerConfig.baseUrl,
            };
          }
        } else if (configuredProviders.length > 0) {
          // Fallback to first configured provider
          const firstProvider = configuredProviders[0];
          const providerConfig = availableProviders[firstProvider];
          if (providerConfig && providerConfig.models.length > 0) {
            activeConfig = {
              provider: firstProvider,
              model: providerConfig.models[0].id,
              parameters: providerConfig.defaultParameters,
              apiKey: '',
              baseUrl: providerConfig.baseUrl,
            };
          }
        }

          set({
            availableProviders: availableProviders as Record<AIProvider, ProviderConfig>,
            configuredProviders,
            activeConfig,
            isReady,
            requiresSetup: !isReady,
            isLoading: false,
            error: null,
            isInitialized: true,
          });

        } catch (error) {
          console.error('Failed to initialize providers:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to initialize providers',
            isLoading: false,
            isReady: false,
            requiresSetup: true,
            isInitialized: false,
          });
        }
      })();
      
      // Store the promise and return it
      set({ initializationPromise: initPromise });
      return initPromise;
    },

    /**
     * Set active provider with immediate model update
     * Eliminates provider/model mismatch issues
     */
    setActiveProvider: async (provider: AIProvider, model?: string) => {
      const { availableProviders, configuredProviders } = get();
      
      if (!configuredProviders.includes(provider)) {
        set({ error: `Provider ${provider} is not configured` });
        return;
      }

      const providerConfig = availableProviders[provider];
      if (!providerConfig || providerConfig.models.length === 0) {
        set({ error: `Provider ${provider} has no available models` });
        return;
      }

      // Use specified model or default to first available model
      const selectedModel = model || providerConfig.models[0].id;
      const modelExists = providerConfig.models.some(m => m.id === selectedModel);
      
      if (!modelExists) {
        set({ error: `Model ${selectedModel} not available for provider ${provider}` });
        return;
      }

      const newConfig: ActiveProviderConfig = {
        provider,
        model: selectedModel,
        parameters: providerConfig.defaultParameters,
        apiKey: '', // Never store API keys client-side
        baseUrl: providerConfig.baseUrl,
      };

      set({ 
        activeConfig: newConfig, 
        error: null 
      });
    },

    /**
     * Set active model for current provider
     * Ensures model is valid for current provider
     */
    setActiveModel: (modelId: string) => {
      const { activeConfig, availableProviders } = get();
      
      if (!activeConfig) {
        set({ error: 'No active provider selected' });
        return;
      }

      const providerConfig = availableProviders[activeConfig.provider];
      if (!providerConfig) {
        set({ error: `Provider ${activeConfig.provider} configuration not found` });
        return;
      }

      const model = providerConfig.models.find(m => m.id === modelId);
      if (!model) {
        set({ error: `Model ${modelId} not found for provider ${activeConfig.provider}` });
        return;
      }

      set({
        activeConfig: {
          ...activeConfig,
          model: modelId,
          parameters: providerConfig.defaultParameters, // Reset parameters for new model
        },
        error: null,
      });
    },

    /**
     * Update parameters for current active configuration
     */
    updateParameters: (parameters: Record<string, any>) => {
      const { activeConfig } = get();
      
      if (!activeConfig) {
        set({ error: 'No active provider selected' });
        return;
      }

      set({
        activeConfig: {
          ...activeConfig,
          parameters: { ...activeConfig.parameters, ...parameters },
        },
      });
    },

    /**
     * Save API key and update configured providers
     * Automatically sets as active provider if it's the first one configured
     */
    saveApiKey: async (provider: AIProvider, apiKey: string, baseUrl?: string) => {
      set({ isValidating: true, error: null });
      
      try {
        const result = await saveProviderApiKey(provider, apiKey, baseUrl);
        
        if (result.success) {
          // Refresh the store state
          await get().refreshProviders();
          
          // If this is the first configured provider, make it active
          const { configuredProviders, activeConfig } = get();
          if (!activeConfig && configuredProviders.includes(provider)) {
            await get().setActiveProvider(provider);
          }
        }
        
        set({ isValidating: false });
        return result;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save API key';
        set({ 
          error: errorMessage,
          isValidating: false 
        });
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Refresh providers from backend
     * Used after API key changes or configuration updates
     */
    refreshProviders: async () => {
      await get().initializeProviders();
    },

    /**
     * Reset store to initial state
     */
    reset: () => {
      set({
        activeConfig: null,
        availableProviders: {} as Record<AIProvider, ProviderConfig>,
        configuredProviders: [],
        isLoading: false,
        isValidating: false,
        error: null,
        isInitialized: false,
        initializationPromise: null,
        isReady: false,
        requiresSetup: true,
      });
    },
  }))
);

/**
 * Selector hooks for specific store slices
 * Prevents unnecessary re-renders
 */
export const useActiveProvider = () => useProviderStore(state => state.activeConfig);
export const useConfiguredProviders = () => useProviderStore(state => state.configuredProviders);
export const useProviderReady = () => useProviderStore(state => ({ isReady: state.isReady, requiresSetup: state.requiresSetup }));
export const useProviderError = () => useProviderStore(state => state.error);
export const useProviderLoading = () => useProviderStore(state => ({ isLoading: state.isLoading, isValidating: state.isValidating }));

/**
 * Get available models for current provider
 */
export const useAvailableModels = (): ModelInfo[] => {
  return useProviderStore(state => {
    if (!state.activeConfig) return [];
    const providerConfig = state.availableProviders[state.activeConfig.provider];
    return providerConfig?.models || [];
  });
};

/**
 * Get parameter constraints for current model
 */
export const useModelConstraints = () => {
  return useProviderStore(state => {
    if (!state.activeConfig) return {};
    const providerConfig = state.availableProviders[state.activeConfig.provider];
    if (!providerConfig) return {};
    const model = providerConfig.models.find(m => m.id === state.activeConfig!.model);
    return model?.constraints || {};
  });
};