/**
 * @file sessionCacheService.ts
 * @description Session-based caching service for AI provider settings persistence.
 * This service provides temporary storage for provider preferences during a browser session
 * using sessionStorage. It complements the existing providerConfigService by providing
 * quick access to recently used settings without persisting sensitive data like API keys.
 *
 * @requires ../types/aiProvider
 */

import { AIProvider, ModelParameters } from '../types/aiProvider';

/**
 * Session settings interface for non-sensitive provider configuration data
 * Excludes sensitive information like API keys and baseUrls
 */
export interface SessionSettings {
  /** The currently active AI provider */
  provider: AIProvider;
  /** The currently active model for the provider */
  model: string;
  /** Model parameters/configuration for the current provider */
  parameters: ModelParameters;
  /** Timestamp when the settings were cached */
  timestamp: number;
}

/**
 * Cache result interface for load operations
 */
export interface CacheResult<T> {
  /** Whether the operation was successful */
  success: boolean;
  /** The cached data if successful, null otherwise */
  data: T | null;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Storage configuration constants
 */
const CACHE_CONFIG = {
  /** Key used to store session settings in sessionStorage */
  STORAGE_KEY: 'ai-settings-cache',
  /** Maximum age for cached data in milliseconds (30 minutes) */
  MAX_AGE_MS: 30 * 60 * 1000,
  /** Version for cache format compatibility */
  VERSION: '1.0.0'
} as const;

/**
 * Cached data wrapper with metadata
 */
interface CacheEntry {
  /** Cache format version for compatibility */
  version: string;
  /** The actual cached settings */
  settings: SessionSettings;
  /** When the cache entry was created */
  createdAt: number;
}

/**
 * Session cache service class for managing temporary provider settings
 */
class SessionCacheService {
  /**
   * Checks if sessionStorage is available and functional
   * @returns True if sessionStorage is supported and accessible
   */
  private isSessionStorageAvailable(): boolean {
    try {
      if (typeof Storage === 'undefined' || !window.sessionStorage) {
        return false;
      }

      // Test write/read/delete functionality
      const testKey = '__session_cache_test__';
      const testValue = 'test';
      
      window.sessionStorage.setItem(testKey, testValue);
      const retrievedValue = window.sessionStorage.getItem(testKey);
      window.sessionStorage.removeItem(testKey);
      
      return retrievedValue === testValue;
    } catch (error) {
      // SessionStorage might be disabled in private browsing mode
      console.warn('SessionStorage availability check failed:', error);
      return false;
    }
  }

  /**
   * Validates that cached data is still within acceptable age limits
   * @param timestamp - The timestamp when data was cached
   * @returns True if the data is still fresh
   */
  private isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    const age = now - timestamp;
    return age >= 0 && age <= CACHE_CONFIG.MAX_AGE_MS;
  }

  /**
   * Sanitizes model parameters to ensure no sensitive data is cached
   * @param parameters - The model parameters to sanitize
   * @returns Sanitized parameters with sensitive data removed
   */
  private sanitizeParameters(parameters: ModelParameters): ModelParameters {
    // Create a clean copy and remove any potentially sensitive fields
    const sanitized = { ...parameters };
    
    // Remove any fields that might contain sensitive information
    // (Currently no sensitive fields in ModelParameters, but future-proofing)
    delete (sanitized as any).apiKey;
    delete (sanitized as any).token;
    delete (sanitized as any).secret;
    
    return sanitized;
  }

  /**
   * Validates session settings structure and content
   * @param settings - Settings object to validate
   * @returns True if settings are valid
   */
  private validateSettings(settings: any): settings is SessionSettings {
    if (!settings || typeof settings !== 'object') {
      return false;
    }

    const requiredFields = ['provider', 'model', 'parameters', 'timestamp'];
    for (const field of requiredFields) {
      if (!(field in settings)) {
        return false;
      }
    }

    // Validate types
    if (typeof settings.provider !== 'string' || 
        typeof settings.model !== 'string' ||
        typeof settings.parameters !== 'object' ||
        typeof settings.timestamp !== 'number') {
      return false;
    }

    // Validate timestamp is reasonable (not negative, not too far in the future)
    const now = Date.now();
    if (settings.timestamp < 0 || settings.timestamp > now + 60000) { // Allow 1 minute future tolerance
      return false;
    }

    return true;
  }

  /**
   * Saves provider settings to session storage
   * @param settings - The settings to cache
   * @returns Result indicating success/failure
   */
  public saveSessionSettings(settings: Omit<SessionSettings, 'timestamp'>): Promise<CacheResult<void>> {
    return new Promise((resolve) => {
      if (!this.isSessionStorageAvailable()) {
        resolve({
          success: false,
          data: null,
          error: 'SessionStorage is not available'
        });
        return;
      }

      try {
        const sessionSettings: SessionSettings = {
          ...settings,
          parameters: this.sanitizeParameters(settings.parameters),
          timestamp: Date.now()
        };

        const cacheEntry: CacheEntry = {
          version: CACHE_CONFIG.VERSION,
        settings: sessionSettings,
        createdAt: Date.now()
      };

        const serializedData = JSON.stringify(cacheEntry);
        window.sessionStorage.setItem(CACHE_CONFIG.STORAGE_KEY, serializedData);

        resolve({
          success: true,
          data: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.warn('Failed to save session settings:', errorMessage);
        
        resolve({
          success: false,
          data: null,
          error: errorMessage
        });
      }
    });
  }

  /**
   * Loads provider settings from session storage
   * @returns Cached settings or null if no valid cache exists
   */
  public loadSessionSettings(): Promise<CacheResult<SessionSettings>> {
    return new Promise((resolve) => {
      if (!this.isSessionStorageAvailable()) {
        resolve({
          success: false,
          data: null,
          error: 'SessionStorage is not available'
        });
        return;
      }

      try {
        const cachedData = window.sessionStorage.getItem(CACHE_CONFIG.STORAGE_KEY);
        
        if (!cachedData) {
          resolve({
            success: true,
            data: null,
            error: 'No cached data found'
          });
          return;
        }

        const cacheEntry: CacheEntry = JSON.parse(cachedData);

        // Validate cache entry structure
        if (!cacheEntry || typeof cacheEntry !== 'object' || !('settings' in cacheEntry)) {
          this.clearSessionCache(); // Clear invalid cache
          resolve({
            success: true,
            data: null,
            error: 'Invalid cache format'
          });
          return;
        }

        // Check version compatibility
        if (cacheEntry.version !== CACHE_CONFIG.VERSION) {
          this.clearSessionCache(); // Clear incompatible cache
          resolve({
            success: true,
            data: null,
            error: 'Cache version mismatch'
          });
          return;
        }

        const settings = cacheEntry.settings;

        // Validate settings structure
        if (!this.validateSettings(settings)) {
          this.clearSessionCache(); // Clear invalid settings
          resolve({
            success: true,
            data: null,
            error: 'Invalid settings format'
          });
          return;
        }

        // Check if cache is still valid
        if (!this.isCacheValid(settings.timestamp)) {
          this.clearSessionCache(); // Clear expired cache
          resolve({
            success: true,
            data: null,
            error: 'Cache expired'
          });
          return;
        }

        resolve({
          success: true,
          data: settings
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.warn('Failed to load session settings:', errorMessage);
        
        // Clear potentially corrupted cache
        this.clearSessionCache();
        
        resolve({
          success: false,
          data: null,
          error: `Failed to load session settings: ${errorMessage}`
        });
      }
    });
  }

  /**
   * Clears all cached session data
   * @returns Result indicating success/failure
   */
  public clearSessionCache(): CacheResult<void> {
    if (!this.isSessionStorageAvailable()) {
      return {
        success: false,
        data: null,
        error: 'SessionStorage is not available'
      };
    }

    try {
      window.sessionStorage.removeItem(CACHE_CONFIG.STORAGE_KEY);
      return {
        success: true,
        data: null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn('Failed to clear session cache:', errorMessage);
      
      return {
        success: false,
        data: null,
        error: `Failed to clear session cache: ${errorMessage}`
      };
    }
  }

  /**
   * Checks if there are valid cached settings available
   * @returns True if valid cached settings exist
   */
  public async hasCachedSettings(): Promise<boolean> {
    const result = await this.loadSessionSettings();
    return result.success && result.data !== null;
  }

  /**
   * Gets information about the current cache state
   * @returns Cache information object
   */
  public async getCacheInfo(): Promise<{
    isSupported: boolean;
    hasCachedData: boolean;
    cacheAge?: number;
    version?: string;
  }> {
    const isSupported = this.isSessionStorageAvailable();
    
    if (!isSupported) {
      return { isSupported: false, hasCachedData: false };
    }

    const result = await this.loadSessionSettings();
    
    if (!result.success || !result.data) {
      return { isSupported: true, hasCachedData: false };
    }

    const cacheAge = Date.now() - result.data.timestamp;
    
    return {
      isSupported: true,
      hasCachedData: true,
      cacheAge,
      version: CACHE_CONFIG.VERSION
    };
  }

  /**
   * Updates only the parameters portion of cached settings
   * This is useful for parameter-only changes without changing provider/model
   * @param parameters - New parameters to cache
   * @returns Result indicating success/failure
   */
  public async updateCachedParameters(parameters: ModelParameters): Promise<CacheResult<void>> {
    const currentCache = await this.loadSessionSettings();
    
    if (!currentCache.success || !currentCache.data) {
      return {
        success: false,
        data: null,
        error: 'No existing cache to update'
      };
    }

    const updatedSettings = {
      ...currentCache.data,
      parameters: this.sanitizeParameters(parameters),
      timestamp: Date.now()
    };

    return await this.saveSessionSettings(updatedSettings);
  }
}

// Create and export singleton instance
export const sessionCacheService = new SessionCacheService();
export default sessionCacheService;