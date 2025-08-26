/**
 * @file index.ts
 * @description Export all provider-specific settings components and related types.
 * This file provides a centralized way to import provider components and
 * creates the component mapping for dynamic provider selection.
 */

import { AIProvider } from '../../../services/providerService';
import { ProviderComponentMap, ProviderMetadata } from './types';

// Import all provider components
import AnthropicSettings from './AnthropicSettings';
import GoogleSettings from './GoogleSettings';
import OpenAISettings from './OpenAISettings';
import OpenRouterSettings from './OpenRouterSettings';
import OllamaSettings from './OllamaSettings';
import UnsupportedProvider from './UnsupportedProvider';

// Export individual components
export {
  AnthropicSettings,
  GoogleSettings,
  OpenAISettings,
  OpenRouterSettings,
  OllamaSettings,
  UnsupportedProvider
};

// Export types
export * from './types';

/**
 * Component mapping for dynamic provider selection
 * Maps provider identifiers to their corresponding React components
 */
export const providerComponents: ProviderComponentMap = {
  anthropic: AnthropicSettings,
  google: GoogleSettings,
  openai: OpenAISettings,
  openrouter: OpenRouterSettings,
  ollama: OllamaSettings,
  groq: OpenRouterSettings, // Groq uses the same component as OpenRouter
  // Fallback for unsupported providers
  cohere: UnsupportedProvider,
  mistral: UnsupportedProvider,
};

/**
 * Provider metadata for UI display and configuration
 */
export const providerMetadata: Record<AIProvider, ProviderMetadata> = {
  anthropic: {
    provider: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Advanced conversational AI with strong reasoning capabilities',
    isSupported: true,
    docsUrl: 'https://docs.anthropic.com/',
    apiKeyUrl: 'https://console.anthropic.com/'
  },
  google: {
    provider: 'google',
    name: 'Google Gemini',
    description: 'Multimodal AI models with fast inference and large context windows',
    isSupported: true,
    docsUrl: 'https://ai.google.dev/docs',
    apiKeyUrl: 'https://makersuite.google.com/app/apikey'
  },
  openai: {
    provider: 'openai',
    name: 'OpenAI',
    description: 'Industry-leading language models including GPT-4 and GPT-3.5',
    isSupported: true,
    docsUrl: 'https://platform.openai.com/docs',
    apiKeyUrl: 'https://platform.openai.com/api-keys'
  },
  openrouter: {
    provider: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified API access to multiple AI models from different providers',
    isSupported: true,
    docsUrl: 'https://openrouter.ai/docs',
    apiKeyUrl: 'https://openrouter.ai/keys'
  },
  ollama: {
    provider: 'ollama',
    name: 'Ollama',
    description: 'Local deployment of open-source language models',
    isSupported: true,
    docsUrl: 'https://ollama.ai/docs',
    apiKeyUrl: 'https://ollama.ai'
  },
  cohere: {
    provider: 'cohere',
    name: 'Cohere',
    description: 'Enterprise-focused language models with strong text understanding',
    isSupported: false,
    docsUrl: 'https://docs.cohere.ai/',
    apiKeyUrl: 'https://dashboard.cohere.ai/api-keys'
  },
  mistral: {
    provider: 'mistral',
    name: 'Mistral AI',
    description: 'Efficient and powerful open-source language models',
    isSupported: false,
    docsUrl: 'https://docs.mistral.ai/',
    apiKeyUrl: 'https://console.mistral.ai/'
  },
  groq: {
    provider: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference with specialized AI hardware',
    isSupported: true,
    docsUrl: 'https://console.groq.com/docs',
    apiKeyUrl: 'https://console.groq.com/keys'
  }
};

/**
 * Helper function to get the appropriate component for a provider
 * @param provider - The AI provider identifier
 * @returns The React component for the provider's settings
 */
export function getProviderComponent(provider: AIProvider) {
  return providerComponents[provider] || UnsupportedProvider;
}

/**
 * Helper function to check if a provider has dedicated component support
 * @param provider - The AI provider identifier
 * @returns True if the provider has a dedicated settings component
 */
export function isProviderSupported(provider: AIProvider): boolean {
  return providerMetadata[provider]?.isSupported ?? false;
}

/**
 * Get all supported providers (those with dedicated components)
 * @returns Array of supported provider identifiers
 */
export function getSupportedProviders(): AIProvider[] {
  return Object.keys(providerMetadata).filter(
    (provider) => providerMetadata[provider as AIProvider].isSupported
  ) as AIProvider[];
}

/**
 * Get all providers that are coming soon (unsupported but listed)
 * @returns Array of upcoming provider identifiers
 */
export function getUpcomingProviders(): AIProvider[] {
  return Object.keys(providerMetadata).filter(
    (provider) => !providerMetadata[provider as AIProvider].isSupported
  ) as AIProvider[];
}