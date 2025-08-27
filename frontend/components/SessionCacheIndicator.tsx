/**
 * @file SessionCacheIndicator.tsx
 * @description React component that displays session cache status and provides cache management controls.
 * This component serves as an example of how to integrate the session cache service into the UI
 * and provides users with visibility and control over their cached settings.
 *
 * @requires react
 * @requires ../hooks/useSessionCache
 */

import React from 'react';
import { useSessionCache } from '../hooks/useSessionCache';

/**
 * Props for the SessionCacheIndicator component
 */
interface SessionCacheIndicatorProps {
  /** Whether to show detailed cache information */
  showDetails?: boolean;
  /** Whether to show cache management buttons */
  showControls?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Whether to show the component inline or as a block */
  inline?: boolean;
}

/**
 * Formats cache age in a human-readable format
 * @param ageMs - Age in milliseconds
 * @returns Formatted age string
 */
function formatCacheAge(ageMs: number): string {
  const seconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s ago`;
  } else {
    return `${seconds}s ago`;
  }
}

/**
 * SessionCacheIndicator component for displaying and managing session cache state
 * 
 * This component provides:
 * - Visual indication of cache availability and status
 * - Cache age information
 * - Quick access to cache management operations
 * - Error display for cache-related issues
 * 
 * @example
 * ```tsx
 * // Minimal indicator
 * <SessionCacheIndicator />
 * 
 * // Full featured with controls
 * <SessionCacheIndicator showDetails={true} showControls={true} />
 * 
 * // Inline status indicator
 * <SessionCacheIndicator inline={true} className="text-sm" />
 * ```
 */
export function SessionCacheIndicator({
  showDetails = false,
  showControls = false,
  className = '',
  inline = false
}: SessionCacheIndicatorProps): JSX.Element {
  const {
    isSupported,
    hasCachedData,
    cacheAge,
    version,
    isLoading,
    lastError,
    loadFromCache,
    saveToCache,
    clearCache,
    refreshCacheInfo
  } = useSessionCache();

  // Don't render if session storage is not supported
  if (!isSupported) {
    return (
      <div className={`text-yellow-600 text-sm ${className}`}>
        ⚠️ Session storage not available
      </div>
    );
  }

  const baseClasses = inline 
    ? `inline-flex items-center space-x-2 ${className}`
    : `flex flex-col space-y-2 ${className}`;

  return (
    <div className={baseClasses}>
      {/* Main Status Indicator */}
      <div className={inline ? 'flex items-center space-x-1' : 'flex items-center justify-between'}>
        <div className="flex items-center space-x-2">
          {/* Cache Status Icon */}
          <span className="text-sm" title="Session Cache Status">
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : hasCachedData ? (
              <span className="text-green-600">💾</span>
            ) : (
              <span className="text-gray-400">💾</span>
            )}
          </span>

          {/* Status Text */}
          <span className="text-sm font-medium">
            {isLoading ? (
              'Loading...'
            ) : hasCachedData ? (
              inline ? 'Cached' : 'Session Cache Active'
            ) : (
              inline ? 'No Cache' : 'No Session Cache'
            )}
          </span>

          {/* Cache Age */}
          {hasCachedData && cacheAge !== undefined && (
            <span className="text-xs text-gray-500">
              ({formatCacheAge(cacheAge)})
            </span>
          )}
        </div>

        {/* Refresh Button */}
        {!inline && (
          <button
            onClick={refreshCacheInfo}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            title="Refresh cache information"
          >
            🔄
          </button>
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && !inline && (
        <div className="text-xs text-gray-600 space-y-1">
          {version && (
            <div>Cache Version: {version}</div>
          )}
          {hasCachedData && cacheAge !== undefined && (
            <div>
              Cache Age: {formatCacheAge(cacheAge)}
              {cacheAge > 25 * 60 * 1000 && (
                <span className="text-yellow-600 ml-2">
                  (expires in {Math.round((30 * 60 * 1000 - cacheAge) / 60000)}m)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {lastError && (
        <div className={`text-red-600 text-xs ${inline ? 'ml-2' : ''}`}>
          ⚠️ {lastError}
        </div>
      )}

      {/* Control Buttons */}
      {showControls && !inline && (
        <div className="flex space-x-2">
          <button
            onClick={loadFromCache}
            disabled={!hasCachedData || isLoading}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Load settings from session cache"
          >
            Load Cache
          </button>
          
          <button
            onClick={saveToCache}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save current settings to session cache"
          >
            Save Cache
          </button>
          
          <button
            onClick={clearCache}
            disabled={!hasCachedData || isLoading}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear session cache"
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact session cache indicator for use in toolbars or status bars
 * 
 * @example
 * ```tsx
 * <div className="flex items-center space-x-4">
 *   <span>Provider: Google</span>
 *   <CompactCacheIndicator />
 * </div>
 * ```
 */
export function CompactCacheIndicator(): JSX.Element {
  return (
    <SessionCacheIndicator
      inline={true}
      className="text-xs"
      showDetails={false}
      showControls={false}
    />
  );
}

/**
 * Full-featured cache management panel
 * Suitable for use in settings pages or dedicated cache management sections
 * 
 * @example
 * ```tsx
 * <div className="bg-gray-50 p-4 rounded-lg">
 *   <h3 className="text-lg font-semibold mb-4">Session Cache</h3>
 *   <CacheManagementPanel />
 * </div>
 * ```
 */
export function CacheManagementPanel(): JSX.Element {
  return (
    <SessionCacheIndicator
      showDetails={true}
      showControls={true}
      className="bg-white border border-gray-200 rounded-lg p-4"
    />
  );
}

export default SessionCacheIndicator;