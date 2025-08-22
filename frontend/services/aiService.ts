/**
 * @file aiService.ts
 * @description Multi-provider AI service that proxies requests through secure backend.
 * No longer stores API keys client-side - all credentials are managed server-side.
 * @deprecated Direct API calls - Use providerService.generateAIResponse() instead
 */

import { generateAIResponse } from './providerService';

/**
 * Supported AI providers for the multi-provider service
 */
export type AIProvider = 'google' | 'openai' | 'openrouter';

/**
 * Configuration options for AI providers
 */
export interface AIProviderOptions {
  baseURL?: string;
}

/**
 * Result of API key validation
 */
export interface APIKeyValidationResult {
  success: boolean;
}

/**
 * @deprecated This function has been replaced by secure backend validation
 * API keys should no longer be validated client-side for security reasons
 * Use providerService.saveProviderApiKey() instead
 */
export async function validateApiKey(
  provider: AIProvider,
  apiKey: string,
  options?: AIProviderOptions
): Promise<APIKeyValidationResult> {
  console.warn(
    'validateApiKey() is deprecated for security reasons. ' +
    'Use providerService.saveProviderApiKey() for secure validation and storage.'
  );
  
  throw new Error(
    'Direct API key validation is no longer supported for security reasons. ' +
    'Use the secure backend endpoint via providerService.saveProviderApiKey().'
  );
}

/**
 * @deprecated This function has been replaced by secure backend model listing
 * API keys should no longer be used client-side for security reasons
 * Model listing will be implemented through secure backend endpoints in the future
 */
export async function listModels(
  provider: AIProvider,
  apiKey: string,
  options?: AIProviderOptions
): Promise<string[]> {
  console.warn(
    'listModels() is deprecated for security reasons. ' +
    'Model listing will be implemented through secure backend endpoints.'
  );
  
  throw new Error(
    'Direct model listing is no longer supported for security reasons. ' +
    'Model listing through secure backend endpoints will be implemented in a future update.'
  );
}

/**
 * Generate content using AI through secure backend proxy
 * This is the recommended way to interact with AI providers
 */
export async function generateContent(
  provider: AIProvider,
  model: string,
  prompt: string,
  parameters?: Record<string, unknown>,
  systemMessage?: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  return generateAIResponse(provider, model, prompt, parameters, systemMessage);
}