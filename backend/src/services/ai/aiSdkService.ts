/**
 * @file aiSdkService.ts
 * @description Unified AI service implementation using Vercel AI SDK.
 * Replaces the custom AIProviderFactory and individual service implementations
 * with a clean, type-safe interface that supports all major AI providers.
 * 
 * Supported Providers: OpenAI, Anthropic, Google (Gemini), OpenRouter, Ollama, Cohere, Mistral, Groq
 */

import { generateText, streamText, CoreMessage, LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOllama } from 'ollama-ai-provider';
import { createCohere } from '@ai-sdk/cohere';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { AIProvider, ModelParameters, AIRequest } from '../../types/aiProvider';
import { 
  MODEL_CONFIG, 
  getProviderConfig, 
  getProviderModels,
  getModelConfig, 
  ProviderOptions,
  ProviderConfig as ModelProviderConfig,
  ModelConfig
} from '../../config/model-config';

/**
 * Standardized AI response interface
 */
export interface AIResponse {
  /** The generated text response */
  text: string;
  /** Token usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Additional metadata from the provider */
  metadata?: Record<string, any>;
  /** The model used for generation */
  model: string;
  /** Processing time in milliseconds */
  processingTime?: number;
  /** Finish reason */
  finishReason?: string;
}

/**
 * Request configuration for AI API calls
 */
export interface CompletionRequest {
  provider: AIProvider;
  model: string;
  prompt: string;
  systemMessage?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  parameters?: ModelParameters;
  apiKey: string;
  baseUrl?: string;
  /** Provider-specific advanced options */
  providerOptions?: ProviderOptions;
  /** JSON Schema for structured output (where supported) */
  schema?: Record<string, any>;
  /** Function/tool definitions for function calling */
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

/**
 * Streaming completion callback type
 */
export type StreamChunkCallback = (chunk: string) => void;

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

/**
 * Error class for AI service related errors
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public provider: string,
    public originalError?: any
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'AIServiceError';
  }
}

/**
 * Get a Vercel AI SDK provider instance based on the provider type and configuration
 * @param provider - The AI provider to create
 * @param apiKey - API key for authentication
 * @param baseUrl - Optional base URL override
 * @returns Configured provider instance
 * @throws AIServiceError if provider is unsupported or configuration is invalid
 */
export function getProviderInstance(provider: AIProvider, apiKey: string, baseUrl?: string): any {
  // Ollama typically doesn't require an API key for local instances
  if (provider !== 'ollama' && (!apiKey || apiKey.trim() === '')) {
    throw new AIServiceError('API key is required', provider);
  }

  try {
    switch (provider) {
      case 'openai':
        return createOpenAI({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });

      case 'anthropic':
        return createAnthropic({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });

      case 'google':
        return createGoogleGenerativeAI({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });

      case 'openrouter':
        return createOpenRouter({
          apiKey,
          baseURL: baseUrl || 'https://openrouter.ai/api/v1',
        });

      case 'ollama':
        return createOllama({
          baseURL: baseUrl || 'http://localhost:11434',
          // Ollama typically doesn't require an API key for local instances
          ...(apiKey && apiKey !== 'local' && { apiKey }),
        });

      case 'cohere':
        return createCohere({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });

      case 'mistral':
        return createMistral({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });

      case 'groq':
        return createGroq({
          apiKey,
          ...(baseUrl && { baseURL: baseUrl }),
        });

      default:
        throw new AIServiceError(`Unsupported provider: ${provider}`, provider);
    }
  } catch (error) {
    throw new AIServiceError(
      `Failed to create provider instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      provider,
      error
    );
  }
}


/**
 * Convert conversation history and prompt to CoreMessage format with provider-specific handling
 * @param request - The completion request
 * @returns Array of CoreMessage objects and system message handling info
 */
function buildMessages(request: CompletionRequest): { 
  messages: CoreMessage[]; 
  systemHandling: 'standard' | 'top-level' | 'parameter'; 
  systemMessage?: string;
} {
  const messages: CoreMessage[] = [];
  const providerConfig = getProviderConfig(request.provider);
  const systemHandling = providerConfig.specialHandling.systemMessageHandling;
  
  let systemMessage = request.systemMessage;
  
  // Handle system message based on provider requirements
  if (systemMessage && systemHandling === 'standard') {
    // Standard handling - add as system message
    messages.push({
      role: 'system',
      content: systemMessage,
    });
    systemMessage = undefined; // Clear since we added it to messages
  } else if (systemMessage && systemHandling === 'top-level') {
    // Top-level handling (Anthropic) - will be passed as separate parameter
    // Don't add to messages, keep systemMessage for later use
  } else if (systemMessage && systemHandling === 'parameter') {
    // Parameter handling (Google, Cohere) - will be passed in provider options
    // Don't add to messages, keep systemMessage for later use
  }

  // Add conversation history if provided
  if (request.conversationHistory) {
    request.conversationHistory.forEach(msg => {
      // Skip system messages if they're handled differently by the provider
      if (msg.role === 'system' && systemHandling !== 'standard') {
        return;
      }
      
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });
  }

  // Add current prompt as user message
  messages.push({
    role: 'user',
    content: request.prompt,
  });

  return { messages, systemHandling, systemMessage };
}

/**
 * Build provider-specific parameters with advanced features support
 * @param request - The completion request
 * @param systemMessage - System message if handled as parameter
 * @returns Normalized parameters object with provider-specific options
 */
function buildProviderParameters(
  request: CompletionRequest,
  systemMessage?: string
): Record<string, any> {
  const providerConfig = getProviderConfig(request.provider);
  const normalized: Record<string, any> = {};
  const parameters = request.parameters || {};

  // Common parameters
  if (parameters.temperature !== undefined) {
    normalized.temperature = parameters.temperature;
  }
  if (parameters.maxTokens !== undefined) {
    normalized.maxTokens = parameters.maxTokens;
  }

  // Apply provider-specific parameter mappings from config
  Object.entries(providerConfig.parameterMappings).forEach(([original, mapped]) => {
    if (original in parameters && (parameters as any)[original] !== undefined) {
      normalized[mapped] = (parameters as any)[original];
    }
  });

  // Handle provider-specific options
  const providerOptions = request.providerOptions;
  
  switch (request.provider) {
    case 'openai':
      if (providerOptions?.openai) {
        Object.assign(normalized, providerOptions.openai);
      }
      // Handle structured output
      if (request.schema && providerOptions?.openai?.responseFormat?.type === 'json_schema') {
        normalized.responseFormat = {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: request.schema,
            strict: true,
          },
        };
      }
      break;

    case 'anthropic':
      // Anthropic requires system message as top-level parameter
      if (systemMessage) {
        normalized.system = systemMessage;
      }
      if (providerOptions?.anthropic) {
        // Handle cache control
        if (providerOptions.anthropic.cacheControl) {
          normalized.providerOptions = {
            anthropic: { cacheControl: providerOptions.anthropic.cacheControl }
          };
        }
        if (providerOptions.anthropic.beta) {
          normalized.headers = {
            'anthropic-beta': providerOptions.anthropic.beta.join(',')
          };
        }
      }
      break;

    case 'google':
      if (providerOptions?.google) {
        Object.assign(normalized, providerOptions.google);
      }
      // Handle system instruction for Google
      if (systemMessage) {
        normalized.systemInstruction = systemMessage;
      }
      break;

    case 'cohere':
      if (providerOptions?.cohere) {
        // Handle provider options
        Object.assign(normalized, providerOptions.cohere);
      }
      // Handle system message as preamble for Cohere
      if (systemMessage) {
        normalized.preamble = systemMessage;
      }
      break;

    case 'mistral':
      if (providerOptions?.mistral) {
        Object.assign(normalized, providerOptions.mistral);
      }
      // Handle structured output for Mistral
      if (request.schema && providerOptions?.mistral?.responseFormat) {
        normalized.responseFormat = {
          type: 'json_object',
          schema: request.schema,
        };
      }
      break;

    case 'groq':
      if (providerOptions?.groq) {
        Object.assign(normalized, providerOptions.groq);
      }
      // Handle structured output for Groq
      if (request.schema) {
        normalized.responseFormat = {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: request.schema,
            strict: true,
          },
        };
      }
      break;

    case 'openrouter':
      if (providerOptions?.openrouter) {
        // Handle OpenRouter-specific routing options
        if (providerOptions.openrouter.provider) {
          normalized.providerOptions = { openrouter: providerOptions.openrouter };
        }
      }
      break;

    case 'ollama':
      if (providerOptions?.ollama) {
        Object.assign(normalized, providerOptions.ollama);
      }
      break;
  }

  // Handle function/tool calling if supported
  if (request.tools && request.tools.length > 0) {
    const modelConfig = getModelConfig(request.provider, request.model);
    if (modelConfig?.capabilities.functionCalling) {
      normalized.tools = request.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      // Set tool choice based on provider
      if (providerOptions?.openai?.toolChoice) {
        normalized.toolChoice = providerOptions.openai.toolChoice;
      } else if (providerOptions?.groq?.toolChoice) {
        normalized.toolChoice = providerOptions.groq.toolChoice;
      } else if (providerOptions?.mistral?.toolChoice) {
        normalized.toolChoice = providerOptions.mistral.toolChoice;
      } else {
        normalized.toolChoice = 'auto'; // Default
      }
    }
  }

  // Remove undefined values
  Object.keys(normalized).forEach(key => {
    if (normalized[key] === undefined) {
      delete normalized[key];
    }
  });

  return normalized;
}

/**
 * Generate a text completion using the specified provider
 * @param request - The completion request
 * @returns Promise resolving to the AI response
 * @throws AIServiceError if the request fails
 */
export async function generateCompletion(request: CompletionRequest): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    // Validate model configuration
    const modelConfig = getModelConfig(request.provider, request.model);
    if (!modelConfig) {
      throw new AIServiceError(`Model ${request.model} not found for provider ${request.provider}`, request.provider);
    }

    // Get provider instance
    const provider = getProviderInstance(request.provider, request.apiKey, request.baseUrl);
    
    // Get the specific model
    const model: LanguageModel = provider(request.model);
    
    // Build messages with provider-specific system message handling
    const { messages, systemMessage } = buildMessages(request);
    
    // Build provider-specific parameters
    const parameters = buildProviderParameters(request, systemMessage);

    // Generate completion with advanced features
    const result = await generateText({
      model,
      messages,
      ...parameters,
    });

    // Build enhanced response
    const response: AIResponse = {
      text: result.text,
      usage: result.usage ? {
        promptTokens: result.usage.inputTokens || 0,
        completionTokens: result.usage.outputTokens || 0,
        totalTokens: result.usage.totalTokens || 0,
      } : undefined,
      metadata: {
        finishReason: result.finishReason,
        warnings: result.warnings,
        response: result.response,
        toolCalls: result.toolCalls,
        modelCapabilities: {
          streaming: modelConfig.capabilities.streaming,
          functionCalling: modelConfig.capabilities.functionCalling,
          structuredOutput: modelConfig.capabilities.structuredOutput,
          vision: modelConfig.capabilities.vision,
        },
        providerConfig: {
          name: getProviderConfig(request.provider).name,
          specialHandling: getProviderConfig(request.provider).specialHandling,
        },
      },
      model: request.model,
      processingTime: Date.now() - startTime,
      finishReason: result.finishReason,
    };

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new AIServiceError(`Failed to generate completion: ${errorMessage}`, request.provider, error);
  }
}

/**
 * Generate a streaming text completion using the specified provider
 * @param request - The completion request
 * @param onChunk - Callback function called for each text chunk
 * @returns Promise resolving to the final AI response
 * @throws AIServiceError if the request fails
 */
export async function streamCompletion(
  request: CompletionRequest,
  onChunk: StreamChunkCallback
): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    // Validate model configuration
    const modelConfig = getModelConfig(request.provider, request.model);
    if (!modelConfig) {
      throw new AIServiceError(`Model ${request.model} not found for provider ${request.provider}`, request.provider);
    }

    if (!modelConfig.capabilities.streaming) {
      throw new AIServiceError(`Model ${request.model} does not support streaming`, request.provider);
    }

    // Get provider instance
    const provider = getProviderInstance(request.provider, request.apiKey, request.baseUrl);
    
    // Get the specific model
    const model: LanguageModel = provider(request.model);
    
    // Build messages with provider-specific system message handling
    const { messages, systemMessage } = buildMessages(request);
    
    // Build provider-specific parameters
    const parameters = buildProviderParameters(request, systemMessage);

    // Generate streaming completion with advanced features
    const result = await streamText({
      model,
      messages,
      ...parameters,
    });

    // Collect full text and stream chunks
    let fullText = '';
    
    for await (const delta of result.textStream) {
      fullText += delta;
      onChunk(delta);
    }

    // Wait for final results
    const finalResult = await result.finishReason;
    const usage = await result.usage;
    const toolCalls = await result.toolCalls;

    // Build enhanced response
    const response: AIResponse = {
      text: fullText,
      usage: usage ? {
        promptTokens: usage.inputTokens || 0,
        completionTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0,
      } : undefined,
      metadata: {
        finishReason: finalResult,
        warnings: await result.warnings,
        response: await result.response,
        toolCalls: toolCalls,
        modelCapabilities: {
          streaming: modelConfig.capabilities.streaming,
          functionCalling: modelConfig.capabilities.functionCalling,
          structuredOutput: modelConfig.capabilities.structuredOutput,
          vision: modelConfig.capabilities.vision,
        },
        providerConfig: {
          name: getProviderConfig(request.provider).name,
          specialHandling: getProviderConfig(request.provider).specialHandling,
        },
      },
      model: request.model,
      processingTime: Date.now() - startTime,
      finishReason: finalResult,
    };

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new AIServiceError(`Failed to stream completion: ${errorMessage}`, request.provider, error);
  }
}

/**
 * Test connection to a provider by attempting a simple generation
 * @param provider - The AI provider to test
 * @param apiKey - API key for authentication
 * @param baseUrl - Optional base URL override
 * @param model - Optional model to test (uses default if not provided)
 * @returns Promise resolving to true if connection is successful
 */
export async function testProviderConnection(
  provider: AIProvider,
  apiKey: string,
  baseUrl?: string,
  model?: string
): Promise<boolean> {
  try {
    // Import default models from config
    const { DEFAULT_MODELS } = await import('../../config/model-config');
    const testModel = model || DEFAULT_MODELS[provider];
    
    const testRequest: CompletionRequest = {
      provider,
      model: testModel,
      prompt: 'Hello',
      parameters: { maxTokens: 5, temperature: 0 },
      apiKey,
      baseUrl,
    };

    await generateCompletion(testRequest);
    return true;
  } catch (error) {
    console.error(`Provider connection test failed for ${provider}:`, error);
    return false;
  }
}

/**
 * Get list of supported providers
 * @returns Array of supported provider names
 */
export function getSupportedProviders(): AIProvider[] {
  return Object.keys(MODEL_CONFIG) as AIProvider[];
}

/**
 * Create a structured output request with JSON Schema validation
 * @param request - Base completion request
 * @param schema - JSON Schema for response structure
 * @returns Enhanced completion request with structured output
 */
export function createStructuredOutputRequest(
  request: CompletionRequest,
  schema: Record<string, any>
): CompletionRequest {
  const modelConfig = getModelConfig(request.provider, request.model);
  
  if (!modelConfig?.capabilities.structuredOutput) {
    throw new AIServiceError(
      `Model ${request.model} does not support structured output`, 
      request.provider
    );
  }

  return {
    ...request,
    schema,
    providerOptions: {
      ...request.providerOptions,
      ...(request.provider === 'openai' && {
        openai: {
          ...request.providerOptions?.openai,
          responseFormat: { type: 'json_schema' },
        },
      }),
      ...(request.provider === 'groq' && {
        groq: {
          ...request.providerOptions?.groq,
          responseFormat: { type: 'json_schema' },
        },
      }),
      ...(request.provider === 'mistral' && {
        mistral: {
          ...request.providerOptions?.mistral,
          responseFormat: { type: 'json_object' },
        },
      }),
    },
  };
}

/**
 * Create a function calling request with tool definitions
 * @param request - Base completion request
 * @param tools - Function/tool definitions
 * @param toolChoice - Tool choice strategy
 * @returns Enhanced completion request with function calling
 */
export function createFunctionCallingRequest(
  request: CompletionRequest,
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>,
  toolChoice: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } } = 'auto'
): CompletionRequest {
  const modelConfig = getModelConfig(request.provider, request.model);
  
  if (!modelConfig?.capabilities.functionCalling) {
    throw new AIServiceError(
      `Model ${request.model} does not support function calling`, 
      request.provider
    );
  }

  return {
    ...request,
    tools,
    providerOptions: {
      ...request.providerOptions,
      ...(request.provider === 'openai' && {
        openai: {
          ...request.providerOptions?.openai,
          toolChoice,
        },
      }),
      ...(request.provider === 'groq' && {
        groq: {
          ...request.providerOptions?.groq,
          toolChoice,
        },
      }),
      ...(request.provider === 'mistral' && {
        mistral: {
          ...request.providerOptions?.mistral,
          toolChoice,
        },
      }),
    },
  };
}

/**
 * Create a cached request for providers that support caching
 * @param request - Base completion request
 * @param cacheOptions - Caching configuration
 * @returns Enhanced completion request with caching
 */
export function createCachedRequest(
  request: CompletionRequest,
  cacheOptions: {
    anthropic?: { type: 'ephemeral'; beta?: boolean };
    google?: { cachedContent?: string };
  }
): CompletionRequest {
  const modelConfig = getModelConfig(request.provider, request.model);
  
  if (!modelConfig?.capabilities.caching) {
    throw new AIServiceError(
      `Model ${request.model} does not support caching`, 
      request.provider
    );
  }

  return {
    ...request,
    providerOptions: {
      ...request.providerOptions,
      ...(request.provider === 'anthropic' && cacheOptions.anthropic && {
        anthropic: {
          ...request.providerOptions?.anthropic,
          cacheControl: cacheOptions.anthropic,
        },
      }),
      ...(request.provider === 'google' && cacheOptions.google && {
        google: {
          ...request.providerOptions?.google,
          ...cacheOptions.google,
        },
      }),
    },
  };
}

/**
 * Create a safety-configured request for providers that support safety settings
 * @param request - Base completion request
 * @param safetySettings - Safety configuration
 * @returns Enhanced completion request with safety settings
 */
export function createSafetyConfiguredRequest(
  request: CompletionRequest,
  safetySettings: {
    google?: Array<{
      category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 
                'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
      threshold: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
    }>;
    mistral?: { safePrompt?: boolean };
  }
): CompletionRequest {
  return {
    ...request,
    providerOptions: {
      ...request.providerOptions,
      ...(request.provider === 'google' && safetySettings.google && {
        google: {
          ...request.providerOptions?.google,
          safetySettings: safetySettings.google,
        },
      }),
      ...(request.provider === 'mistral' && safetySettings.mistral && {
        mistral: {
          ...request.providerOptions?.mistral,
          safePrompt: safetySettings.mistral.safePrompt,
        },
      }),
    },
  };
}

/**
 * Get provider capabilities for a specific model
 * @param provider - The AI provider
 * @param modelId - The model identifier
 * @returns Model capabilities or null if model not found
 */
export function getProviderCapabilities(provider: AIProvider, modelId: string) {
  const modelConfig = getModelConfig(provider, modelId);
  return modelConfig?.capabilities || null;
}

/**
 * Get estimated cost for a completion request
 * @param request - The completion request
 * @param estimatedInputTokens - Estimated input tokens
 * @param estimatedOutputTokens - Estimated output tokens
 * @returns Estimated cost in USD
 */
export function getEstimatedCost(
  request: CompletionRequest,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): { inputCost: number; outputCost: number; totalCost: number; currency: string } {
  const modelConfig = getModelConfig(request.provider, request.model);
  
  if (!modelConfig) {
    return { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' };
  }

  const inputCost = (estimatedInputTokens / 1000) * modelConfig.inputCostPer1K;
  const outputCost = (estimatedOutputTokens / 1000) * modelConfig.outputCostPer1K;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    currency: 'USD',
  };
}


/**
 * Validate parameters for a specific provider
 * @param provider - The AI provider
 * @param parameters - Parameters to validate
 * @param modelId - Optional specific model to validate against
 * @returns Validation result with errors if any
 */
export function validateParameters(
  provider: AIProvider, 
  parameters: ModelParameters, 
  modelId?: string
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const providerConfig = getProviderConfig(provider);
  const modelConfig = modelId ? getModelConfig(provider, modelId) : null;

  // Common validations
  if (parameters.temperature !== undefined) {
    if (parameters.temperature < 0 || parameters.temperature > 2) {
      errors.push('temperature must be between 0 and 2');
    }
  }

  if (parameters.maxTokens !== undefined) {
    if (parameters.maxTokens < 1) {
      errors.push('maxTokens must be at least 1');
    }
    
    // Use model-specific max token limits from config
    const maxTokenLimit = modelConfig?.capabilities.maxOutputTokens || 4096;
    if (parameters.maxTokens > maxTokenLimit) {
      errors.push(`maxTokens must not exceed ${maxTokenLimit} for ${modelId || 'this model'}`);
    }
  }

  // Validate against provider-specific parameter mappings and constraints
  const params = parameters as any;

  // OpenAI and OpenRouter validation
  if (provider === 'openai' || provider === 'openrouter') {
    if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
      errors.push('top_p must be between 0 and 1');
    }
    if (params.presence_penalty !== undefined && (params.presence_penalty < -2 || params.presence_penalty > 2)) {
      errors.push('presence_penalty must be between -2 and 2');
    }
    if (params.frequency_penalty !== undefined && (params.frequency_penalty < -2 || params.frequency_penalty > 2)) {
      errors.push('frequency_penalty must be between -2 and 2');
    }
  }

  // Google Gemini validation
  if (provider === 'google') {
    if (params.topK !== undefined && (params.topK < 1 || params.topK > 40)) {
      errors.push('topK must be between 1 and 40');
    }
    if (params.topP !== undefined && (params.topP < 0 || params.topP > 1)) {
      errors.push('topP must be between 0 and 1');
    }
  }

  // Anthropic validation
  if (provider === 'anthropic') {
    if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
      errors.push('top_p must be between 0 and 1');
    }
    if (params.top_k !== undefined && (params.top_k < 0 || params.top_k > 200)) {
      errors.push('top_k must be between 0 and 200');
    }
  }

  // Ollama validation
  if (provider === 'ollama') {
    if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
      errors.push('top_p must be between 0 and 1');
    }
    if (params.top_k !== undefined && params.top_k < 1) {
      errors.push('top_k must be at least 1');
    }
    if (params.repeat_penalty !== undefined && (params.repeat_penalty < 0.1 || params.repeat_penalty > 2.0)) {
      errors.push('repeat_penalty must be between 0.1 and 2.0');
    }
    // Warn about API key requirement for Ollama
    if (modelConfig && !modelConfig.available) {
      warnings.push('This model may not be available locally. Ensure the model is downloaded in Ollama.');
    }
  }

  // Cohere validation
  if (provider === 'cohere') {
    if (params.p !== undefined && (params.p < 0 || params.p > 1)) {
      errors.push('p (top_p) must be between 0 and 1');
    }
    if (params.k !== undefined && (params.k < 0 || params.k > 500)) {
      errors.push('k (top_k) must be between 0 and 500');
    }
    if (params.frequency_penalty !== undefined && (params.frequency_penalty < 0 || params.frequency_penalty > 1)) {
      errors.push('frequency_penalty must be between 0 and 1');
    }
    if (params.presence_penalty !== undefined && (params.presence_penalty < 0 || params.presence_penalty > 1)) {
      errors.push('presence_penalty must be between 0 and 1');
    }
  }

  // Mistral validation
  if (provider === 'mistral') {
    if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
      errors.push('top_p must be between 0 and 1');
    }
    if (params.random_seed !== undefined && (params.random_seed < 0 || params.random_seed > 2147483647)) {
      errors.push('random_seed must be between 0 and 2147483647');
    }
  }

  // Groq validation
  if (provider === 'groq') {
    if (params.top_p !== undefined && (params.top_p < 0 || params.top_p > 1)) {
      errors.push('top_p must be between 0 and 1');
    }
    if (params.seed !== undefined && (params.seed < 0 || params.seed > 2147483647)) {
      errors.push('seed must be between 0 and 2147483647');
    }
  }

  // Check for unsupported features
  if (modelConfig) {
    if (!modelConfig.capabilities.streaming) {
      warnings.push('This model does not support streaming responses');
    }
    if (!modelConfig.capabilities.functionCalling) {
      warnings.push('This model does not support function calling');
    }
    if (!modelConfig.capabilities.structuredOutput) {
      warnings.push('This model does not support structured JSON output');
    }
    if (!modelConfig.capabilities.vision) {
      warnings.push('This model does not support image/vision inputs');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Export configuration utilities for external use
 */
export {
  getProviderConfig,
  getProviderModels,
  getModelConfig,
  getProvidersWithFeature,
  getParameterMapping,
  providerSupportsFeature,
  estimateRequestCost,
  DEFAULT_MODELS,
} from '../../config/model-config';

/**
 * Get comprehensive provider information including models and capabilities
 * @param provider - The AI provider
 * @returns Complete provider information
 */
export function getProviderInfo(provider: AIProvider) {
  const config = getProviderConfig(provider);
  const models = getProviderModels(provider);
  
  return {
    ...config,
    models,
    isAvailable: config.requiresApiKey || provider === 'ollama',
    defaultModel: models.find((m: ModelConfig) => m.available)?.id || models[0]?.id,
    estimatedCostRange: {
      minInputCostPer1K: Math.min(...models.map((m: ModelConfig) => m.inputCostPer1K)),
      maxInputCostPer1K: Math.max(...models.map((m: ModelConfig) => m.inputCostPer1K)),
      minOutputCostPer1K: Math.min(...models.map((m: ModelConfig) => m.outputCostPer1K)),
      maxOutputCostPer1K: Math.max(...models.map((m: ModelConfig) => m.outputCostPer1K)),
    },
  };
}