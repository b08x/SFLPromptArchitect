/**
 * @file types.ts
 * @description TypeScript interfaces and types for provider-specific settings components.
 * Defines the standard interface that all provider components must implement
 * for consistent integration with the main ProviderSetupPage.
 */

import { AIProvider } from '../../../services/providerService';

/**
 * Validation status type for API key validation
 */
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

/**
 * Standard props interface that all provider-specific settings components must implement.
 * This ensures consistent integration with the main ProviderSetupPage component.
 */
export interface ProviderSettingsProps {
  /** Current API key value */
  apiKey: string;
  
  /** Callback for API key changes */
  onApiKeyChange: (apiKey: string) => void;
  
  /** Callback to trigger API key validation */
  onValidate: () => void;
  
  /** Current validation status */
  validationStatus: ValidationStatus;
  
  /** Error message from validation failure */
  validationError?: string;
  
  /** Whether validation is currently in progress */
  isValidating: boolean;
  
  /** Callback when setup is successfully completed */
  onSetupComplete?: () => void;
  
  /** The provider this component is configured for */
  provider: AIProvider;
  
  /** Additional provider-specific configuration options */
  config?: Record<string, unknown>;
}

/**
 * Provider component mapping type
 * Maps provider names to their corresponding React components
 */
export interface ProviderComponentMap {
  [key: string]: React.ComponentType<ProviderSettingsProps>;
}

/**
 * Provider metadata for dynamic component selection
 */
export interface ProviderMetadata {
  /** Provider identifier */
  provider: AIProvider;
  
  /** Display name for the provider */
  name: string;
  
  /** Short description of the provider */
  description: string;
  
  /** Provider logo or icon URL (optional) */
  iconUrl?: string;
  
  /** Whether this provider is currently supported */
  isSupported: boolean;
  
  /** Documentation URL for the provider */
  docsUrl?: string;
  
  /** API key acquisition URL */
  apiKeyUrl?: string;
}