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
 * Ollama models configuration (local models)
 */
const OLLAMA_MODELS: ModelInfo[] = [
  {
    id: 'llama3.2:latest',
    name: 'Llama 3.2',
    provider: 'ollama',
    description: 'Meta\'s Llama 3.2 model running locally',
    contextLength: 131072,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'top_k', 'repeat_penalty', 'system'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 0.8 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 0.9 },
      top_k: { min: 1, max: 100, step: 1, default: 40 },
      repeat_penalty: { min: 0.5, max: 2.0, step: 0.1, default: 1.1 },
    },
  },
  {
    id: 'mistral:7b',
    name: 'Mistral 7B',
    provider: 'ollama',
    description: 'Mistral 7B model running locally',
    contextLength: 32768,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'top_k', 'repeat_penalty', 'system'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 0.7 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 0.9 },
      top_k: { min: 1, max: 100, step: 1, default: 40 },
      repeat_penalty: { min: 0.5, max: 2.0, step: 0.1, default: 1.1 },
    },
  },
];

/**
 * Cohere models configuration
 */
const COHERE_MODELS: ModelInfo[] = [
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    description: 'Cohere\'s most powerful model for complex tasks',
    contextLength: 128000,
    supportedParameters: ['temperature', 'maxTokens', 'p', 'k', 'frequency_penalty', 'presence_penalty', 'preamble'],
    constraints: {
      temperature: { min: 0.0, max: 5.0, step: 0.1, default: 0.3 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      p: { min: 0.01, max: 0.99, step: 0.01, default: 0.75 },
      k: { min: 0, max: 500, step: 1, default: 0 },
      frequency_penalty: { min: 0.0, max: 1.0, step: 0.01, default: 0.0 },
      presence_penalty: { min: 0.0, max: 1.0, step: 0.01, default: 0.0 },
    },
    pricing: { input: 3.00, output: 15.00 },
  },
  {
    id: 'command-r',
    name: 'Command R',
    provider: 'cohere',
    description: 'Balanced model for general use',
    contextLength: 128000,
    supportedParameters: ['temperature', 'maxTokens', 'p', 'k', 'frequency_penalty', 'presence_penalty', 'preamble'],
    constraints: {
      temperature: { min: 0.0, max: 5.0, step: 0.1, default: 0.3 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      p: { min: 0.01, max: 0.99, step: 0.01, default: 0.75 },
      k: { min: 0, max: 500, step: 1, default: 0 },
      frequency_penalty: { min: 0.0, max: 1.0, step: 0.01, default: 0.0 },
      presence_penalty: { min: 0.0, max: 1.0, step: 0.01, default: 0.0 },
    },
    pricing: { input: 0.50, output: 1.50 },
  },
];

/**
 * Mistral models configuration
 */
const MISTRAL_MODELS: ModelInfo[] = [
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'mistral',
    description: 'Mistral\'s flagship model for complex reasoning',
    contextLength: 32768,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'random_seed', 'safe_mode', 'system'],
    constraints: {
      temperature: { min: 0.0, max: 1.0, step: 0.1, default: 0.7 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      random_seed: { min: 0, max: 999999, step: 1, default: 0 },
    },
    pricing: { input: 4.00, output: 12.00 },
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    provider: 'mistral',
    description: 'Cost-effective model for everyday tasks',
    contextLength: 32768,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'random_seed', 'safe_mode', 'system'],
    constraints: {
      temperature: { min: 0.0, max: 1.0, step: 0.1, default: 0.7 },
      maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      random_seed: { min: 0, max: 999999, step: 1, default: 0 },
    },
    pricing: { input: 1.00, output: 3.00 },
  },
];

/**
 * Groq models configuration
 */
const GROQ_MODELS: ModelInfo[] = [
  {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B',
    provider: 'groq',
    description: 'Meta\'s Llama 3.1 70B on Groq\'s fast inference',
    contextLength: 131072,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'seed', 'stop', 'system'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 8000, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      seed: { min: 0, max: 999999, step: 1, default: 0 },
    },
    pricing: { input: 0.59, output: 0.79 },
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    description: 'Mixtral 8x7B MoE model on Groq',
    contextLength: 32768,
    supportedParameters: ['temperature', 'maxTokens', 'top_p', 'seed', 'stop', 'system'],
    constraints: {
      temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
      maxTokens: { min: 1, max: 8000, step: 1, default: 1024 },
      top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      seed: { min: 0, max: 999999, step: 1, default: 0 },
    },
    pricing: { input: 0.27, output: 0.27 },
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
  ollama: {
    provider: 'ollama',
    name: 'Ollama',
    description: 'Local AI models via Ollama',
    apiKeyRequired: false,
    baseUrl: 'http://localhost:11434',
    models: OLLAMA_MODELS,
    defaultParameters: {
      temperature: 0.8,
      maxTokens: 1024,
      top_p: 0.9,
      top_k: 40,
      repeat_penalty: 1.1,
    },
    supportedFeatures: ['text', 'local', 'privacy'],
  },
  cohere: {
    provider: 'cohere',
    name: 'Cohere',
    description: 'Cohere\'s language models',
    apiKeyRequired: true,
    models: COHERE_MODELS,
    defaultParameters: {
      temperature: 0.3,
      maxTokens: 1024,
      p: 0.75,
      k: 0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    },
    supportedFeatures: ['text', 'generation', 'classification'],
  },
  mistral: {
    provider: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral\'s efficient language models',
    apiKeyRequired: true,
    models: MISTRAL_MODELS,
    defaultParameters: {
      temperature: 0.7,
      maxTokens: 1024,
      top_p: 1.0,
      random_seed: 0,
      safe_mode: false,
    },
    supportedFeatures: ['text', 'multilingual', 'code'],
  },
  groq: {
    provider: 'groq',
    name: 'Groq',
    description: 'Ultra-fast AI inference via Groq',
    apiKeyRequired: true,
    models: GROQ_MODELS,
    defaultParameters: {
      temperature: 1.0,
      maxTokens: 1024,
      top_p: 1.0,
      seed: 0,
    },
    supportedFeatures: ['text', 'fast-inference', 'code'],
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