/**
 * @file providerConfigService.ts
 * @description This service manages AI provider configuration, including provider selection,
 * API key management, parameter persistence, and provider status tracking.
 * It provides a centralized way to manage dynamic provider switching across the application.
 *
 * @requires ../types/aiProvider
 * @requires ../config/modelCapabilities
 */

import { 
  AIProvider, 
  ActiveProviderConfig, 
  ProviderStatus, 
  ModelParameters 
} from '../types/aiProvider';
import { getProviderCapabilities, validateParameters } from './providerService';
import { PROVIDER_CONFIGS } from '../config/modelCapabilities';
import { sessionCacheService, SessionSettings } from './sessionCacheService';

/**
 * Event types for provider configuration changes
 */
export type ProviderConfigEvent = 'provider-changed' | 'parameters-changed' | 'status-updated';

/**
 * Event listener callback type
 */
export type ConfigEventListener = (config: ActiveProviderConfig) => void;

/**
 * Storage keys for localStorage persistence
 */
const STORAGE_KEYS = {
  CURRENT_PROVIDER: 'sfl-current-provider',
  CURRENT_MODEL: 'sfl-current-model',
  PROVIDER_PARAMETERS: 'sfl-provider-parameters',
  API_KEY_PREFIX: 'sfl-api-key-',
  PROVIDER_STATUS: 'sfl-provider-status'
} as const;

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ActiveProviderConfig = {
  provider: 'google',
  model: 'gemini-2.5-flash',
  parameters: PROVIDER_CONFIGS.google.defaultParameters,
  apiKey: ''
};

/**
 * Service class for managing AI provider configuration
 */
class ProviderConfigService {
  private currentConfig: ActiveProviderConfig;
  private eventListeners: Map<ProviderConfigEvent, Set<ConfigEventListener>>;
  private providerStatuses: Map<AIProvider, ProviderStatus>;

  constructor() {
    // Load configuration from localStorage first
    this.currentConfig = this.loadConfiguration();
    
    // Try to overlay session cache if available (more recent settings)
    if (this.loadFromSessionCache()) {
      console.log('Loaded recent settings from session cache');
    }
    
    this.eventListeners = new Map();
    this.providerStatuses = new Map();
    
    // Initialize event listener sets
    this.eventListeners.set('provider-changed', new Set());
    this.eventListeners.set('parameters-changed', new Set());
    this.eventListeners.set('status-updated', new Set());
    
    // Load provider statuses
    this.initializeProviderStatuses();
  }

  /**
   * Get the current active provider configuration
   */
  getCurrentConfig(): ActiveProviderConfig {
    return { ...this.currentConfig };
  }

  /**
   * Set the active provider
   */
  setProvider(provider: AIProvider): void {
    const providerConfig = PROVIDER_CONFIGS[provider];
    const firstModel = providerConfig.models[0];
    
    this.currentConfig = {
      ...this.currentConfig,
      provider,
      model: firstModel.id,
      parameters: providerConfig.defaultParameters,
      apiKey: this.getApiKey(provider),
      baseUrl: providerConfig.baseUrl
    };
    
    this.saveConfiguration();
    this.saveToSessionCache();
    this.emit('provider-changed', this.currentConfig);
  }

  /**
   * Set the active model for the current provider
   */
  setModel(modelId: string): void {
    const providerConfig = PROVIDER_CONFIGS[this.currentConfig.provider];
    const model = providerConfig.models.find(m => m.id === modelId);
    
    if (!model) {
      throw new Error(`Model ${modelId} not found for provider ${this.currentConfig.provider}`);
    }
    
    this.currentConfig = {
      ...this.currentConfig,
      model: modelId,
      parameters: providerConfig.defaultParameters
    };
    
    this.saveConfiguration();
    this.saveToSessionCache();
    this.emit('provider-changed', this.currentConfig);
  }

  /**
   * Update model parameters
   */
  setParameters(parameters: ModelParameters): void {
    // Validate parameters
    const validation = validateParameters(
      this.currentConfig.provider,
      this.currentConfig.model,
      parameters
    );
    
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }
    
    this.currentConfig = {
      ...this.currentConfig,
      parameters
    };
    
    this.saveConfiguration();
    this.saveToSessionCache();
    this.emit('parameters-changed', this.currentConfig);
  }

  /**
   * Set API key for a provider
   */
  setApiKey(provider: AIProvider, apiKey: string): void {
    try {
      if (apiKey) {
        localStorage.setItem(`${STORAGE_KEYS.API_KEY_PREFIX}${provider}`, apiKey);
      } else {
        localStorage.removeItem(`${STORAGE_KEYS.API_KEY_PREFIX}${provider}`);
      }
      
      // Update current config if this is the active provider
      if (provider === this.currentConfig.provider) {
        this.currentConfig.apiKey = apiKey;
        this.emit('provider-changed', this.currentConfig);
      }
      
      // Update provider status
      this.updateProviderStatus(provider, {
        hasApiKey: Boolean(apiKey),
        lastChecked: new Date()
      });
      
    } catch (error) {
      console.warn(`Failed to save API key for ${provider}:`, error);
    }
  }

  /**
   * Get API key for a provider
   */
  getApiKey(provider: AIProvider): string {
    try {
      return localStorage.getItem(`${STORAGE_KEYS.API_KEY_PREFIX}${provider}`) || '';
    } catch (error) {
      console.warn(`Failed to load API key for ${provider}:`, error);
      return '';
    }
  }

  /**
   * Check if a provider has a valid API key
   */
  hasApiKey(provider: AIProvider): boolean {
    return Boolean(this.getApiKey(provider));
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): AIProvider[] {
    return (Object.keys(PROVIDER_CONFIGS) as AIProvider[]).filter(
      provider => this.hasApiKey(provider)
    );
  }

  /**
   * Get provider status
   */
  getProviderStatus(provider: AIProvider): ProviderStatus {
    return this.providerStatuses.get(provider) || {
      provider,
      isAvailable: false,
      hasApiKey: this.hasApiKey(provider),
      isValid: false,
      lastChecked: new Date()
    };
  }

  /**
   * Update provider status
   */
  updateProviderStatus(provider: AIProvider, updates: Partial<ProviderStatus>): void {
    const currentStatus = this.getProviderStatus(provider);
    const newStatus = { ...currentStatus, ...updates };
    
    this.providerStatuses.set(provider, newStatus);
    this.saveProviderStatuses();
    this.emit('status-updated', this.currentConfig);
  }

  /**
   * Validate current configuration
   */
  validateCurrentConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if API key is present
    if (!this.currentConfig.apiKey) {
      errors.push('API key is required');
    }
    
    // Validate parameters
    const paramValidation = validateParameters(
      this.currentConfig.provider,
      this.currentConfig.model,
      this.currentConfig.parameters
    );
    
    if (!paramValidation.valid) {
      errors.push(...paramValidation.errors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.currentConfig = { ...DEFAULT_CONFIG };
    this.currentConfig.apiKey = this.getApiKey(this.currentConfig.provider);
    this.saveConfiguration();
    this.emit('provider-changed', this.currentConfig);
  }

  /**
   * Add event listener
   */
  addEventListener(event: ProviderConfigEvent, listener: ConfigEventListener): void {
    this.eventListeners.get(event)?.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: ProviderConfigEvent, listener: ConfigEventListener): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  /**
   * Export configuration for backup/sharing
   */
  exportConfiguration(): { 
    provider: AIProvider; 
    model: string; 
    parameters: ModelParameters;
    timestamp: string;
  } {
    return {
      provider: this.currentConfig.provider,
      model: this.currentConfig.model,
      parameters: this.currentConfig.parameters,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import configuration from backup/sharing
   */
  importConfiguration(config: {
    provider: AIProvider;
    model: string;
    parameters: ModelParameters;
  }): void {
    // Validate imported configuration
    const providerConfig = PROVIDER_CONFIGS[config.provider];
    if (!providerConfig) {
      throw new Error(`Invalid provider: ${config.provider}`);
    }
    
    const model = providerConfig.models.find(m => m.id === config.model);
    if (!model) {
      throw new Error(`Invalid model: ${config.model} for provider ${config.provider}`);
    }
    
    const validation = validateParameters(config.provider, config.model, config.parameters);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }
    
    // Apply configuration
    this.currentConfig = {
      provider: config.provider,
      model: config.model,
      parameters: config.parameters,
      apiKey: this.getApiKey(config.provider),
      baseUrl: providerConfig.baseUrl
    };
    
    this.saveConfiguration();
    this.saveToSessionCache();
    this.emit('provider-changed', this.currentConfig);
  }

  /**
   * Load cached settings from session storage if available
   * @returns True if settings were loaded from cache
   */
  loadFromSessionCache(): boolean {
    try {
      const cacheResult = sessionCacheService.loadSessionSettings();
      
      if (!cacheResult.success || !cacheResult.data) {
        return false;
      }

      const cachedSettings = cacheResult.data;
      
      // Validate that the cached provider is still available in PROVIDER_CONFIGS
      const providerConfig = PROVIDER_CONFIGS[cachedSettings.provider];
      if (!providerConfig) {
        sessionCacheService.clearSessionCache();
        return false;
      }

      // Validate that the cached model is still available
      const model = providerConfig.models.find(m => m.id === cachedSettings.model);
      if (!model) {
        sessionCacheService.clearSessionCache();
        return false;
      }

      // Apply cached settings to current configuration
      this.currentConfig = {
        ...this.currentConfig,
        provider: cachedSettings.provider,
        model: cachedSettings.model,
        parameters: cachedSettings.parameters,
        apiKey: this.getApiKey(cachedSettings.provider),
        baseUrl: providerConfig.baseUrl
      };

      return true;
    } catch (error) {
      console.warn('Failed to load from session cache:', error);
      return false;
    }
  }

  /**
   * Get session cache information
   * @returns Cache status and information
   */
  getSessionCacheInfo() {
    return sessionCacheService.getCacheInfo();
  }

  /**
   * Clear session cache
   * @returns Result indicating success/failure
   */
  clearSessionCache() {
    return sessionCacheService.clearSessionCache();
  }

  /**
   * Private: Load configuration from localStorage
   */
  private loadConfiguration(): ActiveProviderConfig {
    try {
      const savedProvider = localStorage.getItem(STORAGE_KEYS.CURRENT_PROVIDER) as AIProvider;
      const savedModel = localStorage.getItem(STORAGE_KEYS.CURRENT_MODEL);
      const savedParameters = localStorage.getItem(STORAGE_KEYS.PROVIDER_PARAMETERS);
      
      let config = { ...DEFAULT_CONFIG };
      
      // Load provider
      if (savedProvider && PROVIDER_CONFIGS[savedProvider]) {
        config.provider = savedProvider;
        config.apiKey = this.getApiKey(savedProvider);
        config.baseUrl = PROVIDER_CONFIGS[savedProvider].baseUrl;
      }
      
      // Load model
      const providerConfig = PROVIDER_CONFIGS[config.provider];
      if (savedModel && providerConfig.models.find(m => m.id === savedModel)) {
        config.model = savedModel;
      } else {
        config.model = providerConfig.models[0].id;
      }
      
      // Load parameters
      if (savedParameters) {
        try {
          const parsedParameters = JSON.parse(savedParameters);
          const validation = validateParameters(config.provider, config.model, parsedParameters);
          if (validation.valid) {
            config.parameters = parsedParameters;
          } else {
            config.parameters = providerConfig.defaultParameters;
          }
        } catch {
          config.parameters = providerConfig.defaultParameters;
        }
      } else {
        config.parameters = providerConfig.defaultParameters;
      }
      
      return config;
    } catch (error) {
      console.warn('Failed to load configuration from localStorage:', error);
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Private: Save configuration to localStorage
   */
  private saveConfiguration(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROVIDER, this.currentConfig.provider);
      localStorage.setItem(STORAGE_KEYS.CURRENT_MODEL, this.currentConfig.model);
      localStorage.setItem(STORAGE_KEYS.PROVIDER_PARAMETERS, JSON.stringify(this.currentConfig.parameters));
    } catch (error) {
      console.warn('Failed to save configuration to localStorage:', error);
    }
  }

  /**
   * Private: Initialize provider statuses
   */
  private initializeProviderStatuses(): void {
    try {
      const savedStatuses = localStorage.getItem(STORAGE_KEYS.PROVIDER_STATUS);
      if (savedStatuses) {
        const parsed = JSON.parse(savedStatuses);
        Object.entries(parsed).forEach(([provider, status]) => {
          this.providerStatuses.set(provider as AIProvider, status as ProviderStatus);
        });
      }
    } catch (error) {
      console.warn('Failed to load provider statuses:', error);
    }
    
    // Initialize missing statuses
    (Object.keys(PROVIDER_CONFIGS) as AIProvider[]).forEach(provider => {
      if (!this.providerStatuses.has(provider)) {
        this.providerStatuses.set(provider, {
          provider,
          isAvailable: false,
          hasApiKey: this.hasApiKey(provider),
          isValid: false,
          lastChecked: new Date()
        });
      }
    });
  }

  /**
   * Private: Save provider statuses
   */
  private saveProviderStatuses(): void {
    try {
      const statusObject = Object.fromEntries(this.providerStatuses);
      localStorage.setItem(STORAGE_KEYS.PROVIDER_STATUS, JSON.stringify(statusObject));
    } catch (error) {
      console.warn('Failed to save provider statuses:', error);
    }
  }

  /**
   * Private: Save current settings to session cache
   */
  private saveToSessionCache(): void {
    try {
      const sessionSettings = {
        provider: this.currentConfig.provider,
        model: this.currentConfig.model,
        parameters: this.currentConfig.parameters
      };
      
      sessionCacheService.saveSessionSettings(sessionSettings);
    } catch (error) {
      // Session cache failures should not interrupt normal operation
      console.warn('Failed to save to session cache:', error);
    }
  }

  /**
   * Private: Emit event to listeners
   */
  private emit(event: ProviderConfigEvent, config: ActiveProviderConfig): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(config);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Create and export singleton instance
export const providerConfigService = new ProviderConfigService();
export default providerConfigService;