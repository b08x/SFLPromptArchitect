/**
 * @file useAIChat.ts
 * @description Advanced AI chat hook using @ai-sdk/react for optimized streaming and conversation management
 * @version 1.0.0
 * @since 0.6.0
 */

import { useChat, UseChatOptions, Message } from 'ai/react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { AIProvider } from '../services/providerService';
import { getProviderConfiguration, validateParameters } from '../services/providerService';
import authService from '../services/authService';

/**
 * Configuration for provider-specific chat sessions
 */
export interface ProviderChatConfig {
  provider: AIProvider;
  model: string;
  systemMessage?: string;
  parameters?: Record<string, unknown>;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Extended message type with provider metadata
 */
export interface EnhancedMessage extends Message {
  metadata?: {
    provider?: AIProvider;
    model?: string;
    tokensUsed?: number;
    latency?: number;
    cost?: number;
  };
}

/**
 * Chat state with provider awareness
 */
export interface ProviderChatState {
  messages: EnhancedMessage[];
  input: string;
  isLoading: boolean;
  error: Error | undefined;
  provider: AIProvider;
  model: string;
  availableModels: string[];
  parameters: Record<string, unknown>;
  canSwitch: boolean;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Return type for useAIChat hook
 */
export interface UseAIChatReturn extends ProviderChatState {
  /** Send a message to the AI */\n  append: (message: Message | string) => Promise<string | null | undefined>;\n  /** Reload/retry last message */\n  reload: () => void;\n  /** Stop current generation */\n  stop: () => void;\n  /** Set input value */\n  setInput: (input: string) => void;\n  /** Clear all messages */\n  clear: () => void;\n  /** Switch provider/model */\n  switchProvider: (provider: AIProvider, model: string) => Promise<void>;\n  /** Update generation parameters */\n  updateParameters: (parameters: Record<string, unknown>) => void;\n  /** Export conversation */\n  exportConversation: () => {\n    provider: AIProvider;\n    model: string;\n    messages: EnhancedMessage[];\n    metadata: {\n      totalTokens: number;\n      estimatedCost: number;\n      timestamp: string;\n    };\n  };\n  /** Import conversation */\n  importConversation: (data: ReturnType<UseAIChatReturn['exportConversation']>) => void;\n}\n\n/**\n * Advanced AI chat hook with provider switching and conversation management\n */\nexport function useAIChat(\n  initialConfig: ProviderChatConfig,\n  options: Partial<UseChatOptions> = {}\n): UseAIChatReturn {\n  const [config, setConfig] = useState<ProviderChatConfig>(initialConfig);\n  const [availableModels, setAvailableModels] = useState<string[]>([]);\n  const [totalTokens, setTotalTokens] = useState(0);\n  const [estimatedCost, setEstimatedCost] = useState(0);\n\n  // Memoize the API endpoint based on current config\n  const apiEndpoint = useMemo(() => {\n    const params = new URLSearchParams({\n      provider: config.provider,\n      model: config.model,\n      ...(config.systemMessage && { systemMessage: config.systemMessage }),\n      ...(config.parameters && { parameters: JSON.stringify(config.parameters) })\n    });\n    return `/api/chat/stream?${params.toString()}`;\n  }, [config]);\n\n  // Custom fetch function with authentication\n  const customFetch = useCallback(async (url: string, options: RequestInit = {}) => {\n    return await authService.authenticatedFetch(url, {\n      ...options,\n      headers: {\n        'Content-Type': 'application/json',\n        ...options.headers\n      }\n    });\n  }, []);\n\n  // Configure the base useChat hook\n  const chatOptions: UseChatOptions = {\n    api: apiEndpoint,\n    fetch: customFetch,\n    onError: (error) => {\n      console.error('Chat error:', error);\n      if (options.onError) {\n        options.onError(error);\n      }\n    },\n    onFinish: (message, options) => {\n      // Update token usage and cost estimation\n      if (options?.usage) {\n        setTotalTokens(prev => prev + (options.usage?.totalTokens || 0));\n        // Simple cost estimation (this should ideally come from backend)\n        const cost = estimateMessageCost(config.provider, options.usage.totalTokens || 0);\n        setEstimatedCost(prev => prev + cost);\n      }\n      \n      if (options.onFinish) {\n        options.onFinish(message, options);\n      }\n    },\n    maxRetries: config.maxRetries || 3,\n    retryDelay: config.retryDelay || 1000,\n    ...options\n  };\n\n  const {\n    messages,\n    input,\n    setInput,\n    append,\n    reload,\n    stop,\n    isLoading,\n    error,\n    setMessages\n  } = useChat(chatOptions);\n\n  // Load available models for current provider\n  useEffect(() => {\n    const loadModels = async () => {\n      try {\n        const providerConfig = await getProviderConfiguration(config.provider);\n        setAvailableModels(providerConfig.models.map(m => m.id));\n      } catch (error) {\n        console.error('Failed to load models:', error);\n        setAvailableModels([]);\n      }\n    };\n\n    loadModels();\n  }, [config.provider]);\n\n  /**\n   * Switch provider and model\n   */\n  const switchProvider = useCallback(async (provider: AIProvider, model: string) => {\n    try {\n      // Validate the new configuration\n      const providerConfig = await getProviderConfiguration(provider);\n      const modelInfo = providerConfig.models.find(m => m.id === model);\n      \n      if (!modelInfo) {\n        throw new Error(`Model ${model} not found for provider ${provider}`);\n      }\n\n      // Update configuration\n      setConfig(prev => ({\n        ...prev,\n        provider,\n        model,\n        // Reset parameters to defaults for new provider\n        parameters: providerConfig.defaultParameters\n      }));\n\n      // Clear any errors\n      if (error) {\n        // The error will be cleared automatically when the new config is applied\n      }\n    } catch (error) {\n      console.error('Failed to switch provider:', error);\n      throw error;\n    }\n  }, [error]);\n\n  /**\n   * Update generation parameters\n   */\n  const updateParameters = useCallback((parameters: Record<string, unknown>) => {\n    try {\n      // Validate parameters against current model constraints\n      const validation = validateParameters(config.provider, config.model, parameters);\n      if (!validation.valid) {\n        throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);\n      }\n\n      setConfig(prev => ({\n        ...prev,\n        parameters: {\n          ...prev.parameters,\n          ...parameters\n        }\n      }));\n    } catch (error) {\n      console.error('Failed to update parameters:', error);\n      throw error;\n    }\n  }, [config.provider, config.model]);\n\n  /**\n   * Clear messages and reset state\n   */\n  const clear = useCallback(() => {\n    setMessages([]);\n    setTotalTokens(0);\n    setEstimatedCost(0);\n  }, [setMessages]);\n\n  /**\n   * Export conversation with metadata\n   */\n  const exportConversation = useCallback(() => {\n    return {\n      provider: config.provider,\n      model: config.model,\n      messages: messages as EnhancedMessage[],\n      metadata: {\n        totalTokens,\n        estimatedCost,\n        timestamp: new Date().toISOString()\n      }\n    };\n  }, [config.provider, config.model, messages, totalTokens, estimatedCost]);\n\n  /**\n   * Import conversation\n   */\n  const importConversation = useCallback((data: ReturnType<UseAIChatReturn['exportConversation']>) => {\n    setConfig(prev => ({\n      ...prev,\n      provider: data.provider,\n      model: data.model\n    }));\n    setMessages(data.messages as Message[]);\n    setTotalTokens(data.metadata.totalTokens);\n    setEstimatedCost(data.metadata.estimatedCost);\n  }, [setMessages]);\n\n  // Enhanced messages with metadata\n  const enhancedMessages = useMemo((): EnhancedMessage[] => {\n    return messages.map(message => ({\n      ...message,\n      metadata: {\n        provider: config.provider,\n        model: config.model,\n        ...(message as any).metadata\n      }\n    }));\n  }, [messages, config.provider, config.model]);\n\n  return {\n    messages: enhancedMessages,\n    input,\n    setInput,\n    append,\n    reload,\n    stop,\n    clear,\n    isLoading,\n    error,\n    provider: config.provider,\n    model: config.model,\n    availableModels,\n    parameters: config.parameters || {},\n    canSwitch: !isLoading,\n    totalTokens,\n    estimatedCost,\n    switchProvider,\n    updateParameters,\n    exportConversation,\n    importConversation\n  };\n}\n\n/**\n * Simple cost estimation function (should be replaced with backend calculation)\n */\nfunction estimateMessageCost(provider: AIProvider, tokens: number): number {\n  // Very rough estimation - in production this should come from backend\n  const costPerThousandTokens = {\n    openai: 0.002, // GPT-4o average\n    anthropic: 0.015, // Claude 3.5 Sonnet average\n    google: 0.0001875, // Gemini Flash average\n    openrouter: 0.002, // Varies by model\n    ollama: 0, // Local models\n    cohere: 0.001, // Command R+ average\n    mistral: 0.002, // Mistral Large average\n    groq: 0.0005 // Groq average\n  };\n\n  return (tokens / 1000) * (costPerThousandTokens[provider] || 0.002);\n}\n\n/**\n * Hook for managing multiple chat sessions\n */\nexport function useMultipleChats() {\n  const [sessions, setSessions] = useState<Map<string, UseAIChatReturn>>(new Map());\n  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);\n\n  /**\n   * Create a new chat session\n   */\n  const createSession = useCallback((\n    id: string,\n    config: ProviderChatConfig,\n    options?: Partial<UseChatOptions>\n  ) => {\n    // Note: This is a conceptual implementation\n    // In practice, you'd need to manage multiple useChat instances differently\n    // This would require a more complex state management solution\n    \n    console.warn('useMultipleChats is a conceptual implementation. Use individual useAIChat hooks instead.');\n    \n    return {\n      id,\n      config,\n      // Placeholder for actual chat implementation\n    };\n  }, []);\n\n  return {\n    sessions,\n    activeSessionId,\n    createSession,\n    setActiveSession: setActiveSessionId,\n    removeSession: (id: string) => {\n      setSessions(prev => {\n        const updated = new Map(prev);\n        updated.delete(id);\n        return updated;\n      });\n      if (activeSessionId === id) {\n        setActiveSessionId(null);\n      }\n    }\n  };\n}