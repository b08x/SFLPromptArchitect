# Session Cache Service Documentation

The Session Cache Service provides temporary storage for AI provider settings during a browser session, complementing the existing localStorage-based persistence with quick access to recently used configurations.

## Overview

The service uses `sessionStorage` to store non-sensitive provider configuration data, enabling:

- **Fast session-based caching** of provider settings
- **Automatic expiration** after 30 minutes or browser tab closure
- **Browser compatibility checks** and graceful degradation
- **Type-safe integration** with existing provider configuration system
- **Security-first approach** excluding sensitive data like API keys

## Key Features

### 🔒 Security
- **No sensitive data storage** - API keys and secrets are never cached
- **Automatic sanitization** of parameters before storage
- **Validation** of cached data on retrieval

### ⚡ Performance
- **SessionStorage-based** for fast access and automatic cleanup
- **Debounced auto-save** to prevent excessive storage operations
- **Smart caching** with timestamp-based expiration

### 🛡️ Reliability
- **Browser compatibility checks** with graceful fallbacks
- **Comprehensive error handling** for storage quota and access issues
- **Data validation** to prevent corruption and injection attacks

### 🎯 Type Safety
- **Full TypeScript support** with strict type definitions
- **Runtime validation** of cached data structure
- **Integration** with existing provider type system

## API Reference

### Core Service (`sessionCacheService`)

#### `saveSessionSettings(settings: SessionSettings)`
Saves provider settings to session storage.

```typescript
const result = sessionCacheService.saveSessionSettings({
  provider: 'google',
  model: 'gemini-2.5-flash',
  parameters: {
    temperature: 0.7,
    maxTokens: 1024
  }
});

if (result.success) {
  console.log('Settings saved successfully');
} else {
  console.error('Save failed:', result.error);
}
```

#### `loadSessionSettings()`
Loads cached settings from session storage.

```typescript
const result = sessionCacheService.loadSessionSettings();

if (result.success && result.data) {
  console.log('Loaded cached settings:', result.data);
} else {
  console.log('No valid cache available');
}
```

#### `clearSessionCache()`
Clears all cached session data.

```typescript
const result = sessionCacheService.clearSessionCache();
if (result.success) {
  console.log('Cache cleared successfully');
}
```

#### `hasCachedSettings()`
Checks if valid cached settings are available.

```typescript
if (sessionCacheService.hasCachedSettings()) {
  console.log('Cache is available for quick loading');
}
```

#### `getCacheInfo()`
Returns detailed information about cache state.

```typescript
const info = sessionCacheService.getCacheInfo();
console.log({
  isSupported: info.isSupported,      // Browser compatibility
  hasCachedData: info.hasCachedData,  // Cache availability
  cacheAge: info.cacheAge,            // Age in milliseconds
  version: info.version               // Cache format version
});
```

### Enhanced Provider Config Integration

The `providerConfigService` has been enhanced with session cache integration:

#### `loadFromSessionCache()`
Loads settings from session cache into active configuration.

```typescript
if (providerConfigService.loadFromSessionCache()) {
  console.log('Loaded recent settings from session cache');
}
```

#### `getSessionCacheInfo()`
Get cache status information.

```typescript
const cacheInfo = providerConfigService.getSessionCacheInfo();
```

#### `clearSessionCache()`
Clear session cache through provider service.

```typescript
providerConfigService.clearSessionCache();
```

### React Integration

#### `useSessionCache()` Hook
Provides session cache management in React components.

```typescript
import { useSessionCache } from '../hooks/useSessionCache';

function SettingsPanel() {
  const {
    isSupported,
    hasCachedData,
    cacheAge,
    loadFromCache,
    saveToCache,
    clearCache,
    isLoading,
    lastError
  } = useSessionCache();

  return (
    <div>
      <p>Cache Status: {hasCachedData ? 'Available' : 'None'}</p>
      {cacheAge && <p>Age: {Math.round(cacheAge / 1000)}s</p>}
      
      <button onClick={loadFromCache} disabled={!hasCachedData || isLoading}>
        Load from Cache
      </button>
      <button onClick={saveToCache} disabled={isLoading}>
        Save to Cache
      </button>
      <button onClick={clearCache} disabled={isLoading}>
        Clear Cache
      </button>
      
      {lastError && <div className="error">{lastError}</div>}
    </div>
  );
}
```

#### `useAutoSaveCache()` Hook
Automatically saves settings changes to cache.

```typescript
import { useAutoSaveCache } from '../hooks/useSessionCache';

function AutoSaveWrapper({ children }) {
  // Auto-save with 1.5 second debounce
  useAutoSaveCache(true, 1500);
  
  return <>{children}</>;
}
```

### UI Components

#### `SessionCacheIndicator`
Visual indicator for cache status with optional controls.

```typescript
import { SessionCacheIndicator } from '../components/SessionCacheIndicator';

// Minimal status indicator
<SessionCacheIndicator />

// Full-featured management panel
<SessionCacheIndicator showDetails={true} showControls={true} />

// Inline compact indicator
<SessionCacheIndicator inline={true} className="text-sm" />
```

## Configuration

### Cache Settings
```typescript
const CACHE_CONFIG = {
  STORAGE_KEY: 'ai-settings-cache',  // SessionStorage key
  MAX_AGE_MS: 30 * 60 * 1000,       // 30 minutes expiration
  VERSION: '1.0.0'                   // Cache format version
};
```

### Supported Data Types
```typescript
interface SessionSettings {
  provider: AIProvider;        // Provider identifier
  model: string;              // Model identifier
  parameters: ModelParameters; // Non-sensitive parameters only
  timestamp: number;          // Cache creation time
}
```

## Browser Compatibility

### Supported Environments
- **Modern browsers** with sessionStorage support
- **Private browsing modes** with limited storage
- **Mobile browsers** with storage restrictions

### Graceful Degradation
- **Automatic detection** of storage availability
- **Silent fallback** when storage is unavailable
- **No application disruption** for unsupported environments

### Storage Limitations
- **5-10MB typical quota** for sessionStorage
- **Automatic cleanup** on tab/window closure
- **Per-origin isolation** for security

## Error Handling

### Common Error Scenarios
1. **Storage Unavailable**: Browser doesn't support sessionStorage
2. **Quota Exceeded**: Storage limit reached
3. **Access Denied**: Private browsing restrictions
4. **Data Corruption**: Invalid or corrupted cache data
5. **Version Mismatch**: Incompatible cache format

### Error Response Format
```typescript
interface CacheResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}
```

### Handling Strategies
- **Non-blocking errors**: Application continues normally
- **Automatic recovery**: Invalid cache is cleared automatically
- **User feedback**: Clear error messages in UI components
- **Logging**: Console warnings for debugging

## Security Considerations

### Data Sanitization
```typescript
// Sensitive fields are automatically removed
const sanitizedParams = {
  temperature: 0.7,
  maxTokens: 1024
  // apiKey, token, secret fields are stripped
};
```

### Input Validation
- **Structure validation** of cached data
- **Type checking** for all fields
- **Timestamp validation** to prevent injection
- **Version compatibility** checks

### Storage Isolation
- **Per-origin storage** prevents cross-site access
- **Session-only persistence** for temporary data
- **Automatic expiration** after 30 minutes

## Testing

### Unit Tests
Comprehensive test coverage including:

```bash
npm run test                # Run all tests
npm run test:ui             # Interactive test UI
npm run test:coverage       # Coverage reporting
```

### Test Scenarios
- ✅ **Storage operations** (save/load/clear)
- ✅ **Error handling** (quota, access, corruption)
- ✅ **Data validation** (structure, types, security)
- ✅ **Browser compatibility** (availability, fallbacks)
- ✅ **Integration** (provider service, React hooks)

### Mocking for Tests
```typescript
// Automatic mocks available in test environment
import { sessionCacheService } from '../sessionCacheService';

// Storage is automatically mocked in tests
const result = sessionCacheService.saveSessionSettings(testData);
expect(result.success).toBe(true);
```

## Integration Examples

### Basic Integration
```typescript
import { sessionCacheService } from '../services/sessionCacheService';
import { providerConfigService } from '../services/providerConfigService';

// Save current settings to cache
const currentConfig = providerConfigService.getCurrentConfig();
sessionCacheService.saveSessionSettings({
  provider: currentConfig.provider,
  model: currentConfig.model,
  parameters: currentConfig.parameters
});
```

### Auto-save on Changes
```typescript
// Listen for provider changes and auto-save
providerConfigService.addEventListener('provider-changed', (config) => {
  sessionCacheService.saveSessionSettings({
    provider: config.provider,
    model: config.model,
    parameters: config.parameters
  });
});
```

### Cache Restoration
```typescript
// On application startup, try to restore from cache
const cacheResult = sessionCacheService.loadSessionSettings();
if (cacheResult.success && cacheResult.data) {
  // Apply cached settings to provider configuration
  providerConfigService.importConfiguration(cacheResult.data);
}
```

## Performance Considerations

### Optimization Strategies
- **Debounced saves** prevent excessive storage operations
- **Minimal data storage** reduces memory footprint
- **Lazy loading** of cache information
- **Efficient serialization** with JSON

### Best Practices
1. **Use auto-save hooks** for seamless user experience
2. **Monitor cache age** and prompt users for expired data
3. **Provide cache controls** in settings interfaces
4. **Handle errors gracefully** without disrupting workflows

## Migration and Versioning

### Cache Format Versioning
```typescript
// Version compatibility checking
if (cacheEntry.version !== EXPECTED_VERSION) {
  // Clear incompatible cache and start fresh
  sessionCacheService.clearSessionCache();
}
```

### Data Migration
- **Automatic cleanup** of incompatible cache versions
- **Schema validation** prevents format issues
- **Backwards compatibility** consideration for major updates

## Troubleshooting

### Common Issues

#### Cache Not Saving
1. Check browser sessionStorage support
2. Verify storage quota availability
3. Check for private browsing restrictions

#### Cache Not Loading
1. Verify cache hasn't expired (30 min limit)
2. Check for data corruption
3. Ensure compatible cache version

#### Performance Issues
1. Monitor auto-save frequency
2. Check for excessive cache operations
3. Review storage quota usage

### Debug Information
```typescript
// Get comprehensive debug information
const debugInfo = {
  cacheInfo: sessionCacheService.getCacheInfo(),
  storageSupport: typeof Storage !== 'undefined',
  sessionStorageAvailable: !!window.sessionStorage,
  quotaEstimate: navigator.storage?.estimate?.()
};

console.log('Session Cache Debug Info:', debugInfo);
```