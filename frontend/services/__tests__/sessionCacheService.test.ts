/**
 * @file sessionCacheService.test.ts
 * @description Comprehensive unit tests for the SessionCacheService
 * Tests all functionality including edge cases, error handling, and browser compatibility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sessionCacheService, SessionSettings } from '../sessionCacheService';
import type { AIProvider, ModelParameters } from '../../types/aiProvider';

// Mock sessionStorage for testing
const mockSessionStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockSessionStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => { mockSessionStorage.store.set(key, value); }),
  removeItem: vi.fn((key: string) => { mockSessionStorage.store.delete(key); }),
  clear: vi.fn(() => { mockSessionStorage.store.clear(); }),
  get length() { return mockSessionStorage.store.size; },
  key: vi.fn((index: number) => [...mockSessionStorage.store.keys()][index] || null)
};

// Test data fixtures
const createTestSettings = (overrides: Partial<SessionSettings> = {}): Omit<SessionSettings, 'timestamp'> => ({
  provider: 'google' as AIProvider,
  model: 'gemini-2.5-flash',
  parameters: {
    temperature: 0.7,
    maxTokens: 1024,
    topK: 20,
    topP: 0.95
  } as ModelParameters,
  ...overrides
});

const createValidCacheEntry = (settings?: Partial<SessionSettings>) => {
  const testSettings = createTestSettings(settings);
  return JSON.stringify({
    version: '1.0.0',
    settings: {
      ...testSettings,
      timestamp: Date.now()
    },
    createdAt: Date.now()
  });
};

describe('SessionCacheService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockSessionStorage.store.clear();
    vi.clearAllMocks();
    
    // Mock window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
    
    // Mock Storage constructor check
    global.Storage = class Storage {} as any;
  });

  afterEach(() => {
    // Clean up after each test
    mockSessionStorage.store.clear();
    vi.restoreAllMocks();
  });

  describe('saveSessionSettings', () => {
    it('should successfully save valid settings', () => {
      const testSettings = createTestSettings();
      
      const result = sessionCacheService.saveSessionSettings(testSettings);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBeUndefined();
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'ai-settings-cache',
        expect.stringContaining('"provider":"google"')
      );
    });

    it('should sanitize parameters before saving', () => {
      const testSettings = createTestSettings({
        parameters: {
          temperature: 0.7,
          maxTokens: 1024,
          // @ts-ignore - Adding potentially sensitive data for test
          apiKey: 'secret-key',
          token: 'secret-token',
          secret: 'secret-value'
        } as any
      });
      
      sessionCacheService.saveSessionSettings(testSettings);
      
      const savedData = mockSessionStorage.store.get('ai-settings-cache');
      expect(savedData).toBeDefined();
      
      const parsed = JSON.parse(savedData!);
      expect(parsed.settings.parameters.apiKey).toBeUndefined();
      expect(parsed.settings.parameters.token).toBeUndefined();
      expect(parsed.settings.parameters.secret).toBeUndefined();
      expect(parsed.settings.parameters.temperature).toBe(0.7);
    });

    it('should include timestamp when saving', () => {
      const testSettings = createTestSettings();
      const beforeSave = Date.now();
      
      sessionCacheService.saveSessionSettings(testSettings);
      
      const afterSave = Date.now();
      const savedData = mockSessionStorage.store.get('ai-settings-cache');
      const parsed = JSON.parse(savedData!);
      
      expect(parsed.settings.timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(parsed.settings.timestamp).toBeLessThanOrEqual(afterSave);
    });

    it('should handle sessionStorage unavailability', () => {
      // Mock sessionStorage as unavailable
      Object.defineProperty(window, 'sessionStorage', {
        value: undefined,
        writable: true
      });
      
      const testSettings = createTestSettings();
      const result = sessionCacheService.saveSessionSettings(testSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('SessionStorage is not available');
    });

    it('should handle sessionStorage errors gracefully', () => {
      // Mock sessionStorage to throw error
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      
      const testSettings = createTestSettings();
      const result = sessionCacheService.saveSessionSettings(testSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });
  });

  describe('loadSessionSettings', () => {
    it('should successfully load valid cached settings', () => {
      const cacheData = createValidCacheEntry();
      mockSessionStorage.store.set('ai-settings-cache', cacheData);
      
      const result = sessionCacheService.loadSessionSettings();
      
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data?.provider).toBe('google');
      expect(result.data?.model).toBe('gemini-2.5-flash');
      expect(result.data?.parameters.temperature).toBe(0.7);
    });

    it('should return null when no cache exists', () => {
      const result = sessionCacheService.loadSessionSettings();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBe('No cached data found');
    });

    it('should handle invalid JSON gracefully', () => {
      mockSessionStorage.store.set('ai-settings-cache', 'invalid json');
      
      const result = sessionCacheService.loadSessionSettings();
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Failed to load session settings');
      // Should clear corrupted cache
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('ai-settings-cache');
    });

    it('should clear and return null for expired cache', () => {
      // Create expired cache (31 minutes old)
      const expiredTimestamp = Date.now() - (31 * 60 * 1000);
      const expiredCache = JSON.stringify({
        version: '1.0.0',
        settings: {
          ...createTestSettings(),
          timestamp: expiredTimestamp
        },
        createdAt: expiredTimestamp
      });
      
      mockSessionStorage.store.set('ai-settings-cache', expiredCache);
      
      const result = sessionCacheService.loadSessionSettings();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Cache expired');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('ai-settings-cache');
    });

    it('should handle version mismatch', () => {
      const incompatibleCache = JSON.stringify({
        version: '2.0.0', // Different version
        settings: createTestSettings(),
        createdAt: Date.now()
      });
      
      mockSessionStorage.store.set('ai-settings-cache', incompatibleCache);
      
      const result = sessionCacheService.loadSessionSettings();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Cache version mismatch');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('ai-settings-cache');
    });

    it('should validate settings structure', () => {
      const invalidSettings = JSON.stringify({
        version: '1.0.0',
        settings: {
          provider: 'google',
          // Missing model and parameters
          timestamp: Date.now()
        },
        createdAt: Date.now()
      });
      
      mockSessionStorage.store.set('ai-settings-cache', invalidSettings);
      
      const result = sessionCacheService.loadSessionSettings();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid settings format');
    });

    it('should reject future timestamps', () => {
      const futureTimestamp = Date.now() + (5 * 60 * 1000); // 5 minutes in future
      const futureCache = JSON.stringify({
        version: '1.0.0',
        settings: {
          ...createTestSettings(),
          timestamp: futureTimestamp
        },
        createdAt: Date.now()
      });
      
      mockSessionStorage.store.set('ai-settings-cache', futureCache);
      
      const result = sessionCacheService.loadSessionSettings();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid settings format');
    });
  });

  describe('clearSessionCache', () => {
    it('should successfully clear cache', () => {
      mockSessionStorage.store.set('ai-settings-cache', createValidCacheEntry());
      
      const result = sessionCacheService.clearSessionCache();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('ai-settings-cache');
    });

    it('should handle sessionStorage unavailability', () => {
      Object.defineProperty(window, 'sessionStorage', {
        value: undefined,
        writable: true
      });
      
      const result = sessionCacheService.clearSessionCache();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('SessionStorage is not available');
    });
  });

  describe('hasCachedSettings', () => {
    it('should return true when valid cache exists', () => {
      mockSessionStorage.store.set('ai-settings-cache', createValidCacheEntry());
      
      const result = sessionCacheService.hasCachedSettings();
      
      expect(result).toBe(true);
    });

    it('should return false when no cache exists', () => {
      const result = sessionCacheService.hasCachedSettings();
      
      expect(result).toBe(false);
    });

    it('should return false when cache is invalid', () => {
      mockSessionStorage.store.set('ai-settings-cache', 'invalid data');
      
      const result = sessionCacheService.hasCachedSettings();
      
      expect(result).toBe(false);
    });
  });

  describe('getCacheInfo', () => {
    it('should return correct info when cache exists', () => {
      const beforeCache = Date.now();
      mockSessionStorage.store.set('ai-settings-cache', createValidCacheEntry());
      const afterCache = Date.now();
      
      const info = sessionCacheService.getCacheInfo();
      
      expect(info.isSupported).toBe(true);
      expect(info.hasCachedData).toBe(true);
      expect(info.version).toBe('1.0.0');
      expect(info.cacheAge).toBeGreaterThanOrEqual(0);
      expect(info.cacheAge).toBeLessThan(afterCache - beforeCache + 100); // Small tolerance
    });

    it('should return correct info when no cache exists', () => {
      const info = sessionCacheService.getCacheInfo();
      
      expect(info.isSupported).toBe(true);
      expect(info.hasCachedData).toBe(false);
      expect(info.cacheAge).toBeUndefined();
      expect(info.version).toBeUndefined();
    });

    it('should handle unsupported sessionStorage', () => {
      Object.defineProperty(window, 'sessionStorage', {
        value: undefined,
        writable: true
      });
      
      const info = sessionCacheService.getCacheInfo();
      
      expect(info.isSupported).toBe(false);
      expect(info.hasCachedData).toBe(false);
    });
  });

  describe('updateCachedParameters', () => {
    it('should update parameters in existing cache', () => {
      // Set up initial cache
      mockSessionStorage.store.set('ai-settings-cache', createValidCacheEntry());
      
      const newParameters: ModelParameters = {
        temperature: 0.9,
        maxTokens: 2048,
        topK: 30,
        topP: 0.8
      };
      
      const result = sessionCacheService.updateCachedParameters(newParameters);
      
      expect(result.success).toBe(true);
      
      // Verify updated cache
      const loadResult = sessionCacheService.loadSessionSettings();
      expect(loadResult.data?.parameters.temperature).toBe(0.9);
      expect(loadResult.data?.parameters.maxTokens).toBe(2048);
    });

    it('should fail when no existing cache', () => {
      const newParameters: ModelParameters = {
        temperature: 0.9
      };
      
      const result = sessionCacheService.updateCachedParameters(newParameters);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No existing cache to update');
    });

    it('should sanitize parameters during update', () => {
      // Set up initial cache
      mockSessionStorage.store.set('ai-settings-cache', createValidCacheEntry());
      
      const newParameters = {
        temperature: 0.9,
        // @ts-ignore - Adding sensitive data for test
        apiKey: 'should-be-removed'
      } as any;
      
      sessionCacheService.updateCachedParameters(newParameters);
      
      // Verify sensitive data was removed
      const loadResult = sessionCacheService.loadSessionSettings();
      expect((loadResult.data?.parameters as any).apiKey).toBeUndefined();
      expect(loadResult.data?.parameters.temperature).toBe(0.9);
    });
  });

  describe('Browser compatibility', () => {
    it('should handle missing Storage constructor', () => {
      delete (global as any).Storage;
      
      const testSettings = createTestSettings();
      const result = sessionCacheService.saveSessionSettings(testSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('SessionStorage is not available');
    });

    it('should handle sessionStorage access errors', () => {
      // Mock sessionStorage access to throw (private browsing mode)
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('SecurityError: localStorage is not available');
        }
      });
      
      const testSettings = createTestSettings();
      const result = sessionCacheService.saveSessionSettings(testSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('SessionStorage is not available');
    });

    it('should handle quota exceeded errors', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      const testSettings = createTestSettings();
      const result = sessionCacheService.saveSessionSettings(testSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('QuotaExceededError');
    });
  });

  describe('Edge cases and security', () => {
    it('should handle very large parameter objects', () => {
      const largeParameters = {
        temperature: 0.7,
        // Create a large object to test storage limits
        largeArray: new Array(1000).fill('test'),
        largeObject: Object.fromEntries(
          new Array(100).fill(null).map((_, i) => [`key${i}`, `value${i}`])
        )
      } as any;
      
      const testSettings = createTestSettings({ parameters: largeParameters });
      const result = sessionCacheService.saveSessionSettings(testSettings);
      
      // Should handle large objects gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle malicious JSON in cache', () => {
      const maliciousJson = JSON.stringify({
        version: '1.0.0',
        settings: {
          provider: 'google',
          model: 'gemini-2.5-flash',
          parameters: {
            temperature: 0.7,
            // Attempt to inject malicious code
            constructor: { prototype: { polluted: true } }
          },
          timestamp: Date.now()
        },
        createdAt: Date.now()
      });
      
      mockSessionStorage.store.set('ai-settings-cache', maliciousJson);
      
      const result = sessionCacheService.loadSessionSettings();
      
      // Should load safely without prototype pollution
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('should handle circular references in parameters', () => {
      const circularParams: any = { temperature: 0.7 };
      circularParams.self = circularParams; // Create circular reference
      
      const testSettings = createTestSettings({ parameters: circularParams });
      
      // Should handle circular references gracefully (likely throw but not crash)
      expect(() => sessionCacheService.saveSessionSettings(testSettings)).not.toThrow();
    });
  });
});