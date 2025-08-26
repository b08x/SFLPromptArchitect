/**
 * @file model-config.ts
 * @description Centralized configuration for all AI provider models and their capabilities.
 * This file contains comprehensive provider-specific configurations, supported models,
 * advanced features, and parameter mappings for all 8 AI providers.
 */

import { AIProvider } from '../types/aiProvider';

/**
 * Advanced provider-specific options interface
 */
export interface ProviderOptions {
  /** Anthropic-specific options */
  anthropic?: {
    cacheControl?: {
      type: 'ephemeral';
      beta?: boolean;
    };
    beta?: string[];
  };
  
  /** Cohere-specific options */
  cohere?: {
    inputType?: 'search_document' | 'search_query' | 'classification' | 'clustering';
    truncate?: 'NONE' | 'START' | 'END';
    citationQuality?: 'fast' | 'accurate';
    connectors?: Array<{ id: string; userAccessToken?: string; }>;
    searchQueriesOnly?: boolean;
    documents?: Array<{ title: string; snippet: string; }>;
  };
  
  /** Mistral-specific options */
  mistral?: {
    safePrompt?: boolean;
    toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
    responseFormat?: {
      type: 'json_object';
      schema?: Record<string, any>;
    };
  };
  
  /** Google-specific options */
  google?: {
    safetySettings?: Array<{
      category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 
                'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
      threshold: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
    }>;
    generationConfig?: {
      candidateCount?: number;
      maxOutputTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
    };
    cachedContent?: string; // For cached content references
  };
  
  /** Groq-specific options */
  groq?: {
    reasoningEffort?: 'low' | 'medium' | 'high';
    parallelToolCalls?: boolean;
    toolChoice?: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } };
    responseFormat?: {
      type: 'json_object' | 'json_schema';
      json_schema?: {
        name: string;
        description?: string;
        schema: Record<string, any>;
        strict?: boolean;
      };
    };
  };
  
  /** OpenRouter-specific options */
  openrouter?: {
    transforms?: string[];
    models?: string[];
    route?: 'fallback';
    provider?: {
      order?: string[];
      allowFallbacks?: boolean;
    };
  };
  
  /** Ollama-specific options */
  ollama?: {
    keepAlive?: string | number;
    numPredict?: number;
    numCtx?: number;
    numBatch?: number;
    numGqa?: number;
    numGpu?: number;
    mainGpu?: number;
    lowVram?: boolean;
    f16Kv?: boolean;
    logitsAll?: boolean;
    vocabOnly?: boolean;
    useMmap?: boolean;
    useMlock?: boolean;
    numThread?: number;
  };
  
  /** OpenAI-specific options */
  openai?: {
    user?: string;
    logitBias?: Record<string, number>;
    logprobs?: boolean;
    topLogprobs?: number;
    responseFormat?: {
      type: 'text' | 'json_object' | 'json_schema';
      json_schema?: {
        name: string;
        description?: string;
        schema: Record<string, any>;
        strict?: boolean;
      };
    };
    toolChoice?: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } };
    parallelToolCalls?: boolean;
    streamOptions?: {
      includeUsage?: boolean;
    };
  };
}

/**
 * Model capability flags
 */
export interface ModelCapabilities {
  /** Supports streaming responses */
  streaming: boolean;
  /** Supports function/tool calling */
  functionCalling: boolean;
  /** Supports structured JSON output */
  structuredOutput: boolean;
  /** Supports image input */
  vision: boolean;
  /** Supports system messages */
  systemMessages: boolean;
  /** Supports caching */
  caching: boolean;
  /** Supports reasoning modes */
  reasoning: boolean;
  /** Maximum context length in tokens */
  maxContextTokens: number;
  /** Maximum output tokens */
  maxOutputTokens: number;
  /** Supports fine-tuning */
  fineTuning: boolean;
}

/**
 * Individual model configuration
 */
export interface ModelConfig {
  /** Display name for the model */
  name: string;
  /** Model identifier used in API calls */
  id: string;
  /** Model description */
  description: string;
  /** Model capabilities */
  capabilities: ModelCapabilities;
  /** Default parameters for this model */
  defaultParameters: Record<string, any>;
  /** Cost per 1K input tokens (in USD) */
  inputCostPer1K: number;
  /** Cost per 1K output tokens (in USD) */
  outputCostPer1K: number;
  /** Whether the model is currently available */
  available: boolean;
}

/**
 * Provider configuration with all supported models and features
 */
export interface ProviderConfig {
  /** Display name for the provider */
  name: string;
  /** Provider description */
  description: string;
  /** Base URL for API calls */
  baseUrl: string;
  /** Whether API key is required */
  requiresApiKey: boolean;
  /** Supported models */
  models: ModelConfig[];
  /** Provider-specific parameter mappings */
  parameterMappings: Record<string, string>;
  /** Supported capabilities */
  supportedFeatures: string[];
  /** Special handling requirements */
  specialHandling: {
    systemMessageHandling: 'standard' | 'top-level' | 'parameter';
    authenticationMethod: 'bearer' | 'api-key' | 'none';
    streamingProtocol: 'sse' | 'websocket' | 'standard';
  };
}

/**
 * Complete provider configurations
 */
export const MODEL_CONFIG: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    description: 'GPT models from OpenAI including GPT-4, GPT-3.5-turbo, and specialized models',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    models: [
      {
        name: 'GPT-4o',
        id: 'gpt-4o',
        description: 'Most advanced GPT-4 model with improved reasoning and multimodal capabilities',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 128000,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.015,
        outputCostPer1K: 0.06,
        available: true,
      },
      {
        name: 'GPT-4o Mini',
        id: 'gpt-4o-mini',
        description: 'Smaller, faster version of GPT-4o with excellent performance',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 128000,
          maxOutputTokens: 4096,
          fineTuning: true,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.00015,
        outputCostPer1K: 0.0006,
        available: true,
      },
      {
        name: 'GPT-3.5 Turbo',
        id: 'gpt-3.5-turbo',
        description: 'Fast, cost-effective model for most conversational tasks',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: false,
          maxContextTokens: 16385,
          maxOutputTokens: 4096,
          fineTuning: true,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.0005,
        outputCostPer1K: 0.0015,
        available: true,
      },
    ],
    parameterMappings: {
      'top_p': 'topP',
      'presence_penalty': 'presencePenalty',
      'frequency_penalty': 'frequencyPenalty',
    },
    supportedFeatures: ['streaming', 'function_calling', 'structured_output', 'vision', 'fine_tuning'],
    specialHandling: {
      systemMessageHandling: 'standard',
      authenticationMethod: 'bearer',
      streamingProtocol: 'sse',
    },
  },

  anthropic: {
    name: 'Anthropic',
    description: 'Claude models from Anthropic with advanced reasoning and safety features',
    baseUrl: 'https://api.anthropic.com',
    requiresApiKey: true,
    models: [
      {
        name: 'Claude 3.5 Sonnet',
        id: 'claude-3-5-sonnet-20241022',
        description: 'Most intelligent Claude model with excellent reasoning and code capabilities',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: true,
          reasoning: true,
          maxContextTokens: 200000,
          maxOutputTokens: 8192,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8192 },
        inputCostPer1K: 0.003,
        outputCostPer1K: 0.015,
        available: true,
      },
      {
        name: 'Claude 3.5 Haiku',
        id: 'claude-3-5-haiku-20241022',
        description: 'Fastest Claude model, great for simple tasks and high-volume applications',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: true,
          reasoning: false,
          maxContextTokens: 200000,
          maxOutputTokens: 8192,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8192 },
        inputCostPer1K: 0.00025,
        outputCostPer1K: 0.00125,
        available: true,
      },
      {
        name: 'Claude 3 Opus',
        id: 'claude-3-opus-20240229',
        description: 'Most powerful Claude model for highly complex tasks',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: true,
          reasoning: true,
          maxContextTokens: 200000,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.015,
        outputCostPer1K: 0.075,
        available: true,
      },
    ],
    parameterMappings: {
      'top_p': 'topP',
      'top_k': 'topK',
      'stop_sequences': 'stopSequences',
    },
    supportedFeatures: ['streaming', 'function_calling', 'structured_output', 'vision', 'caching'],
    specialHandling: {
      systemMessageHandling: 'top-level',
      authenticationMethod: 'api-key',
      streamingProtocol: 'sse',
    },
  },

  google: {
    name: 'Google AI',
    description: 'Gemini models from Google with multimodal capabilities and safety features',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresApiKey: true,
    models: [
      {
        name: 'Gemini 2.0 Flash Experimental',
        id: 'gemini-2.0-flash-exp',
        description: 'Latest experimental Gemini model with enhanced capabilities',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: true,
          reasoning: true,
          maxContextTokens: 1000000,
          maxOutputTokens: 8192,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8192 },
        inputCostPer1K: 0,
        outputCostPer1K: 0,
        available: true,
      },
      {
        name: 'Gemini 1.5 Pro',
        id: 'gemini-1.5-pro',
        description: 'Most capable Gemini model with 2M token context window',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: true,
          reasoning: true,
          maxContextTokens: 2000000,
          maxOutputTokens: 8192,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8192 },
        inputCostPer1K: 0.00125,
        outputCostPer1K: 0.005,
        available: true,
      },
      {
        name: 'Gemini 1.5 Flash',
        id: 'gemini-1.5-flash',
        description: 'Fast and efficient Gemini model for most tasks',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: true,
          reasoning: false,
          maxContextTokens: 1000000,
          maxOutputTokens: 8192,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8192 },
        inputCostPer1K: 0.000075,
        outputCostPer1K: 0.0003,
        available: true,
      },
    ],
    parameterMappings: {
      'top_p': 'topP',
      'top_k': 'topK',
    },
    supportedFeatures: ['streaming', 'function_calling', 'structured_output', 'vision', 'caching', 'safety_settings'],
    specialHandling: {
      systemMessageHandling: 'parameter',
      authenticationMethod: 'api-key',
      streamingProtocol: 'sse',
    },
  },

  openrouter: {
    name: 'OpenRouter',
    description: 'Access to multiple AI models through a unified API with routing capabilities',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    models: [
      {
        name: 'GPT-4o (via OpenRouter)',
        id: 'openai/gpt-4o',
        description: 'OpenAI GPT-4o via OpenRouter with routing capabilities',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 128000,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.015,
        outputCostPer1K: 0.06,
        available: true,
      },
      {
        name: 'Claude 3.5 Sonnet (via OpenRouter)',
        id: 'anthropic/claude-3.5-sonnet',
        description: 'Anthropic Claude 3.5 Sonnet via OpenRouter',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: true,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 200000,
          maxOutputTokens: 8192,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8192 },
        inputCostPer1K: 0.003,
        outputCostPer1K: 0.015,
        available: true,
      },
      {
        name: 'Llama 3.1 70B Instruct',
        id: 'meta-llama/llama-3.1-70b-instruct',
        description: 'Meta Llama 3.1 70B instruction-following model',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 131072,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.0009,
        outputCostPer1K: 0.0009,
        available: true,
      },
    ],
    parameterMappings: {
      'top_p': 'topP',
      'top_k': 'topK',
      'presence_penalty': 'presencePenalty',
      'frequency_penalty': 'frequencyPenalty',
      'repetition_penalty': 'repetitionPenalty',
      'min_p': 'minP',
    },
    supportedFeatures: ['streaming', 'function_calling', 'routing', 'fallback'],
    specialHandling: {
      systemMessageHandling: 'standard',
      authenticationMethod: 'bearer',
      streamingProtocol: 'sse',
    },
  },

  ollama: {
    name: 'Ollama',
    description: 'Local AI models running on your hardware via Ollama',
    baseUrl: 'http://localhost:11434',
    requiresApiKey: false,
    models: [
      {
        name: 'Llama 3.2 3B',
        id: 'llama3.2:3b',
        description: 'Small, efficient Llama model for local deployment',
        capabilities: {
          streaming: true,
          functionCalling: false,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: false,
          maxContextTokens: 131072,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0,
        outputCostPer1K: 0,
        available: false, // Depends on local installation
      },
      {
        name: 'Llama 3.2 1B',
        id: 'llama3.2:1b',
        description: 'Very small Llama model for quick local testing',
        capabilities: {
          streaming: true,
          functionCalling: false,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: false,
          maxContextTokens: 131072,
          maxOutputTokens: 2048,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 2048 },
        inputCostPer1K: 0,
        outputCostPer1K: 0,
        available: false, // Depends on local installation
      },
      {
        name: 'Code Llama 7B',
        id: 'codellama:7b',
        description: 'Specialized Llama model for code generation and understanding',
        capabilities: {
          streaming: true,
          functionCalling: false,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: false,
          maxContextTokens: 16384,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.1, maxTokens: 4096 },
        inputCostPer1K: 0,
        outputCostPer1K: 0,
        available: false, // Depends on local installation
      },
    ],
    parameterMappings: {
      'top_p': 'topP',
      'top_k': 'topK',
      'repeat_penalty': 'repeatPenalty',
    },
    supportedFeatures: ['streaming', 'local_deployment', 'custom_models'],
    specialHandling: {
      systemMessageHandling: 'standard',
      authenticationMethod: 'none',
      streamingProtocol: 'sse',
    },
  },

  cohere: {
    name: 'Cohere',
    description: 'Cohere models optimized for text generation and retrieval-augmented generation',
    baseUrl: 'https://api.cohere.ai/v1',
    requiresApiKey: true,
    models: [
      {
        name: 'Command R+',
        id: 'command-r-plus',
        description: 'Most capable Cohere model for complex reasoning and RAG',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 128000,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.003,
        outputCostPer1K: 0.015,
        available: true,
      },
      {
        name: 'Command R',
        id: 'command-r',
        description: 'Balanced Cohere model for most tasks',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 128000,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.0005,
        outputCostPer1K: 0.0015,
        available: true,
      },
      {
        name: 'Command',
        id: 'command',
        description: 'Original Cohere command model for general text generation',
        capabilities: {
          streaming: true,
          functionCalling: false,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: false,
          maxContextTokens: 4096,
          maxOutputTokens: 4096,
          fineTuning: true,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.0015,
        outputCostPer1K: 0.002,
        available: true,
      },
    ],
    parameterMappings: {
      'p': 'p', // Cohere uses 'p' instead of 'top_p'
      'k': 'k', // Cohere uses 'k' instead of 'top_k'
      'stop_sequences': 'stopSequences',
      'preamble': 'preamble',
    },
    supportedFeatures: ['streaming', 'function_calling', 'rag_optimization', 'citation'],
    specialHandling: {
      systemMessageHandling: 'parameter',
      authenticationMethod: 'bearer',
      streamingProtocol: 'sse',
    },
  },

  mistral: {
    name: 'Mistral AI',
    description: 'Mistral models with excellent performance and structured output capabilities',
    baseUrl: 'https://api.mistral.ai/v1',
    requiresApiKey: true,
    models: [
      {
        name: 'Mistral Large',
        id: 'mistral-large-latest',
        description: 'Most capable Mistral model for complex tasks',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 128000,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.004,
        outputCostPer1K: 0.012,
        available: true,
      },
      {
        name: 'Mistral Small',
        id: 'mistral-small-latest',
        description: 'Efficient Mistral model for most tasks',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: false,
          maxContextTokens: 128000,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 4096 },
        inputCostPer1K: 0.001,
        outputCostPer1K: 0.003,
        available: true,
      },
      {
        name: 'Codestral',
        id: 'codestral-latest',
        description: 'Specialized Mistral model for code generation',
        capabilities: {
          streaming: true,
          functionCalling: false,
          structuredOutput: false,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: false,
          maxContextTokens: 32000,
          maxOutputTokens: 4096,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.1, maxTokens: 4096 },
        inputCostPer1K: 0.001,
        outputCostPer1K: 0.003,
        available: true,
      },
    ],
    parameterMappings: {
      'top_p': 'topP',
      'random_seed': 'seed',
      'safe_mode': 'safePrompt',
    },
    supportedFeatures: ['streaming', 'function_calling', 'structured_output', 'json_schema'],
    specialHandling: {
      systemMessageHandling: 'standard',
      authenticationMethod: 'bearer',
      streamingProtocol: 'sse',
    },
  },

  groq: {
    name: 'Groq',
    description: 'Ultra-fast inference with Groq Language Processing Unit (LPU)',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    models: [
      {
        name: 'Llama 3.1 70B Versatile',
        id: 'llama-3.1-70b-versatile',
        description: 'Large Llama model with versatile capabilities, optimized for Groq LPU',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 131072,
          maxOutputTokens: 8000,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8000 },
        inputCostPer1K: 0.00059,
        outputCostPer1K: 0.00079,
        available: true,
      },
      {
        name: 'Llama 3.1 8B Instant',
        id: 'llama-3.1-8b-instant',
        description: 'Fast 8B parameter Llama model for quick responses',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: false,
          maxContextTokens: 131072,
          maxOutputTokens: 8000,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8000 },
        inputCostPer1K: 0.00005,
        outputCostPer1K: 0.00008,
        available: true,
      },
      {
        name: 'Mixtral 8x7B Instruct',
        id: 'mixtral-8x7b-32768',
        description: 'Mistral mixture of experts model with 32K context',
        capabilities: {
          streaming: true,
          functionCalling: true,
          structuredOutput: true,
          vision: false,
          systemMessages: true,
          caching: false,
          reasoning: true,
          maxContextTokens: 32768,
          maxOutputTokens: 8000,
          fineTuning: false,
        },
        defaultParameters: { temperature: 0.7, maxTokens: 8000 },
        inputCostPer1K: 0.00024,
        outputCostPer1K: 0.00024,
        available: true,
      },
    ],
    parameterMappings: {
      'top_p': 'topP',
      'seed': 'seed',
      'stop': 'stop',
    },
    supportedFeatures: ['streaming', 'function_calling', 'structured_output', 'ultra_fast_inference'],
    specialHandling: {
      systemMessageHandling: 'standard',
      authenticationMethod: 'bearer',
      streamingProtocol: 'sse',
    },
  },
};

/**
 * Get provider configuration by provider name
 */
export function getProviderConfig(provider: AIProvider): ProviderConfig {
  return MODEL_CONFIG[provider];
}

/**
 * Get all available models for a specific provider
 */
export function getProviderModels(provider: AIProvider): ModelConfig[] {
  return MODEL_CONFIG[provider]?.models || [];
}

/**
 * Get a specific model configuration
 */
export function getModelConfig(provider: AIProvider, modelId: string): ModelConfig | undefined {
  return MODEL_CONFIG[provider]?.models.find(model => model.id === modelId);
}

/**
 * Get all providers that support a specific feature
 */
export function getProvidersWithFeature(feature: string): AIProvider[] {
  return Object.entries(MODEL_CONFIG)
    .filter(([, config]) => config.supportedFeatures.includes(feature))
    .map(([provider]) => provider as AIProvider);
}

/**
 * Get parameter mapping for a specific provider
 */
export function getParameterMapping(provider: AIProvider, parameterName: string): string {
  const config = MODEL_CONFIG[provider];
  return config?.parameterMappings[parameterName] || parameterName;
}

/**
 * Check if a provider supports a specific feature
 */
export function providerSupportsFeature(provider: AIProvider, feature: string): boolean {
  return MODEL_CONFIG[provider]?.supportedFeatures.includes(feature) || false;
}

/**
 * Get estimated cost for a request
 */
export function estimateRequestCost(
  provider: AIProvider,
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelConfig = getModelConfig(provider, modelId);
  if (!modelConfig) return 0;

  const inputCost = (inputTokens / 1000) * modelConfig.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * modelConfig.outputCostPer1K;
  
  return inputCost + outputCost;
}

/**
 * Default models for each provider (used for testing and fallback)
 */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  google: 'gemini-1.5-flash',
  openrouter: 'meta-llama/llama-3.1-70b-instruct',
  ollama: 'llama3.2:1b',
  cohere: 'command-r',
  mistral: 'mistral-small-latest',
  groq: 'llama-3.1-8b-instant',
};

/**
 * Export types for external use
 */