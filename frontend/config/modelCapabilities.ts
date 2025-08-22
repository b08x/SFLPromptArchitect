/**
 * @file modelCapabilities.ts
 * @description Comprehensive model capabilities and provider configuration definitions
 * Contains parameter constraints, model information, and provider-specific settings
 */

import { ProviderConfig, ModelInfo, ParameterPreset, AIProvider } from '../types/aiProvider';

/**
 * Google Gemini models configuration
 */
const GEMINI_MODELS: ModelInfo[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Fast and efficient model for most tasks',
    contextLength: 1000000,
    supportedParameters: ['temperature', 'maxTokens', 'topK', 'topP', 'systemInstruction'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 8192, step: 1, default: 1024 },
      topK: { min: 1, max: 40, step: 1, default: 20 },
      topP: { min: 0.0, max: 1.0, step: 0.05, default: 0.95 },
    },
    pricing: { input: 0.075, output: 0.30 },
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Advanced model for complex reasoning tasks',
    contextLength: 2000000,
    supportedParameters: ['temperature', 'maxTokens', 'topK', 'topP', 'systemInstruction'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 8192, step: 1, default: 1024 },
      topK: { min: 1, max: 40, step: 1, default: 20 },
      topP: { min: 0.0, max: 1.0, step: 0.05, default: 0.95 },
    },
    pricing: { input: 1.25, output: 5.00 },
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Balanced speed and performance',
    contextLength: 1000000,
    supportedParameters: ['temperature', 'maxTokens', 'topK', 'topP', 'systemInstruction'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 8192, step: 1, default: 1024 },
      topK: { min: 1, max: 40, step: 1, default: 20 },
      topP: { min: 0.0, max: 1.0, step: 0.05, default: 0.95 },
    },
    pricing: { input: 0.075, output: 0.30 },
  },
];

/**
 * OpenAI models configuration
 */
const OPENAI_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4 Omni',
    provider: 'openai',
    description: 'Most capable GPT-4 model with multimodal abilities',
    contextLength: 128000,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'presence_penalty', 'frequency_penalty', 'systemMessage'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      presence_penalty: { min: -2.0, max: 2.0, step: 0.1, default: 0.0 },
      frequency_penalty: { min: -2.0, max: 2.0, step: 0.1, default: 0.0 },
    },
    pricing: { input: 2.50, output: 10.00 },
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4 Omni Mini',
    provider: 'openai',
    description: 'Affordable and intelligent small model',
    contextLength: 128000,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'presence_penalty', 'frequency_penalty', 'systemMessage'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 16384, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      presence_penalty: { min: -2.0, max: 2.0, step: 0.1, default: 0.0 },
      frequency_penalty: { min: -2.0, max: 2.0, step: 0.1, default: 0.0 },
    },
    pricing: { input: 0.15, output: 0.60 },
  },
  {
    id: 'o1-preview',
    name: 'O1 Preview',
    provider: 'openai',
    description: 'Advanced reasoning model for complex tasks',
    contextLength: 128000,
    supportedParameters: ['maxTokens'], // O1 models don't support temperature/sampling
    constraints: {
      maxTokens: { min: 1, max: 32768, step: 1, default: 1024 },
    },
    pricing: { input: 15.00, output: 60.00 },
  },
];

/**
 * Anthropic Claude models configuration
 */
const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Most intelligent Claude model',
    contextLength: 200000,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'top_k', 'system'],
    constraints: {
      temperature: { min: 0.0, max: 1.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 8192, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      top_k: { min: 0, max: 200, step: 1, default: 200 },
    },
    pricing: { input: 3.00, output: 15.00 },
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fast and cost-effective model',
    contextLength: 200000,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'top_k', 'system'],
    constraints: {
      temperature: { min: 0.0, max: 1.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      top_k: { min: 0, max: 200, step: 1, default: 200 },
    },
    pricing: { input: 0.25, output: 1.25 },
  },
];

/**
 * OpenRouter models configuration (subset of popular models)
 */
const OPENROUTER_MODELS: ModelInfo[] = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4 Omni (OpenRouter)',
    provider: 'openrouter',
    description: 'GPT-4 Omni via OpenRouter',
    contextLength: 128000,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'presence_penalty', 'frequency_penalty'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      presence_penalty: { min: -2.0, max: 2.0, step: 0.1, default: 0.0 },
      frequency_penalty: { min: -2.0, max: 2.0, step: 0.1, default: 0.0 },
    },
    pricing: { input: 2.50, output: 10.00 },
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    description: 'Claude 3.5 Sonnet via OpenRouter',
    contextLength: 200000,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'top_k'],
    constraints: {
      temperature: { min: 0.0, max: 1.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 8192, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      top_k: { min: 0, max: 200, step: 1, default: 200 },
    },
    pricing: { input: 3.00, output: 15.00 },
  },
];

/**
 * Provider configurations
 */
export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  google: {
    provider: 'google',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI models',
    apiKeyRequired: true,
    models: GEMINI_MODELS,
    defaultParameters: {
      temperature: 1.0,
      maxTokens: 1024,
      topK: 20,
      topP: 0.95,
    },
    supportedFeatures: ['text', 'multimodal', 'code', 'reasoning'],
  },
  openai: {
    provider: 'openai',
    name: 'OpenAI',
    description: 'OpenAI\'s GPT models',
    apiKeyRequired: true,
    models: OPENAI_MODELS,
    defaultParameters: {
      temperature: 1.0,
      maxTokens: 1024,
      top_p: 1.0,
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
    },
    supportedFeatures: ['text', 'multimodal', 'code', 'reasoning', 'function-calling'],
  },
  anthropic: {
    provider: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Anthropic\'s Claude models',
    apiKeyRequired: true,
    models: ANTHROPIC_MODELS,
    defaultParameters: {
      temperature: 1.0,
      maxTokens: 1024,
      top_p: 1.0,
      top_k: 200,
    },
    supportedFeatures: ['text', 'reasoning', 'analysis', 'writing'],
  },
  openrouter: {
    provider: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models via OpenRouter',
    apiKeyRequired: true,
    baseUrl: 'https://openrouter.ai/api/v1',
    models: OPENROUTER_MODELS,
    defaultParameters: {
      temperature: 1.0,
      maxTokens: 1024,
      top_p: 1.0,
    },
    supportedFeatures: ['text', 'multimodal', 'code', 'reasoning', 'multiple-providers'],
  },
};

/**
 * Parameter presets for quick configuration
 */
export const PARAMETER_PRESETS: ParameterPreset[] = [
  {
    name: 'Creative',
    description: 'High creativity for writing and brainstorming',
    provider: 'google',
    parameters: {
      temperature: 1.5,
      topK: 40,
      topP: 0.9,
    },
  },
  {
    name: 'Balanced',
    description: 'Balanced creativity and consistency',
    provider: 'google',
    parameters: {
      temperature: 1.0,
      topK: 20,
      topP: 0.95,
    },
  },
  {
    name: 'Precise',
    description: 'Low creativity for factual and analytical tasks',
    provider: 'google',
    parameters: {
      temperature: 0.2,
      topK: 5,
      topP: 0.8,
    },
  },
  {
    name: 'Creative (OpenAI)',
    description: 'High creativity for OpenAI models',
    provider: 'openai',
    parameters: {
      temperature: 1.5,
      top_p: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    },
  },
  {
    name: 'Balanced (OpenAI)',
    description: 'Balanced settings for OpenAI models',
    provider: 'openai',
    parameters: {
      temperature: 1.0,
      top_p: 1.0,
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
    },
  },
  {
    name: 'Precise (OpenAI)',
    description: 'Low temperature for factual tasks',
    provider: 'openai',
    parameters: {
      temperature: 0.2,
      top_p: 0.8,
      presence_penalty: 0.0,
      frequency_penalty: 0.1,
    },
  },
];

/**
 * Get model information by ID and provider
 */
export function getModelInfo(provider: AIProvider, modelId: string): ModelInfo | undefined {
  return PROVIDER_CONFIGS[provider].models.find(model => model.id === modelId);
}

/**
 * Get all models for a provider
 */
export function getProviderModels(provider: AIProvider): ModelInfo[] {
  return PROVIDER_CONFIGS[provider].models;
}

/**
 * Get parameter constraints for a specific model
 */
export function getParameterConstraints(provider: AIProvider, modelId: string) {
  const model = getModelInfo(provider, modelId);
  return model?.constraints || {};
}

/**
 * Get presets for a specific provider
 */
export function getProviderPresets(provider: AIProvider): ParameterPreset[] {
  return PARAMETER_PRESETS.filter(preset => preset.provider === provider);
}

/**
 * Validate parameters against model constraints
 */
export function validateParameters(provider: AIProvider, modelId: string, parameters: any): { valid: boolean; errors: string[] } {
  const constraints = getParameterConstraints(provider, modelId);
  const errors: string[] = [];

  Object.entries(parameters).forEach(([key, value]) => {
    const constraint = constraints[key as keyof typeof constraints];
    if (constraint && typeof value === 'number') {
      if (value < constraint.min || value > constraint.max) {
        errors.push(`${key} must be between ${constraint.min} and ${constraint.max}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}