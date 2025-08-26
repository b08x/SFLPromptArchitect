/**
 * @file useAIStreaming.ts
 * @description React hooks for streaming AI responses with provider-specific parameter support
 * @version 1.0.0
 * @since 0.6.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService, AIGenerationOptions, AIGenerationResult, StreamChunk, RequestController } from '../services/aiService';
import { AIProvider } from '../services/providerService';

/**
 * State for AI streaming operations
 */
export interface AIStreamingState {
  isLoading: boolean;
  isStreaming: boolean;
  response: string;
  error: string | null;
  metadata: AIGenerationResult['metadata'] | null;
  canCancel: boolean;
}

/**
 * Configuration for useAIStreaming hook
 */
export interface UseAIStreamingConfig {
  /** Auto-clear response when starting new requests */
  autoClear?: boolean;
  /** Enable request debouncing */
  debounceMs?: number;
  /** Default timeout for requests */
  defaultTimeout?: number;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom completion handler */
  onComplete?: (result: AIGenerationResult) => void;
}

/**
 * Return type for useAIStreaming hook
 */
export interface UseAIStreamingReturn extends AIStreamingState {
  /** Generate streaming AI response */
  generateStreaming: (
    provider: AIProvider,
    model: string,
    prompt: string,
    options?: AIGenerationOptions
  ) => Promise<void>;
  /** Generate non-streaming AI response */
  generateResponse: (
    provider: AIProvider,
    model: string,
    prompt: string,
    options?: AIGenerationOptions
  ) => Promise<void>;
  /** Cancel current request */
  cancel: () => void;
  /** Clear current response and reset state */
  clear: () => void;
  /** Retry last request */
  retry: () => Promise<void>;
}

/**
 * Hook for streaming AI responses with comprehensive state management
 */
export function useAIStreaming(config: UseAIStreamingConfig = {}): UseAIStreamingReturn {
  const {
    autoClear = true,
    debounceMs = 300,
    defaultTimeout = 30000,
    onError,
    onComplete
  } = config;

  const [state, setState] = useState<AIStreamingState>({
    isLoading: false,
    isStreaming: false,
    response: '',
    error: null,
    metadata: null,
    canCancel: false
  });

  const controllerRef = useRef<RequestController | null>(null);
  const lastRequestRef = useRef<{
    provider: AIProvider;
    model: string;
    prompt: string;
    options?: AIGenerationOptions;
    streaming: boolean;
  } | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.cancel('Component unmounting');
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Clear current state
   */
  const clear = useCallback(() => {
    setState({
      isLoading: false,
      isStreaming: false,
      response: '',
      error: null,
      metadata: null,
      canCancel: false
    });
  }, []);

  /**
   * Cancel current request
   */
  const cancel = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.cancel('Request cancelled by user');
      controllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isLoading: false,
      isStreaming: false,
      canCancel: false
    }));\n  }, []);

  /**
   * Handle streaming chunks
   */
  const handleStreamChunk = useCallback((chunk: StreamChunk) => {
    setState(prev => ({
      ...prev,
      response: prev.response + chunk.content,
      isStreaming: !chunk.finished,
      isLoading: false,
      metadata: chunk.finished ? chunk.metadata || prev.metadata : prev.metadata
    }));\n  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error: error.message,
      isLoading: false,
      isStreaming: false,
      canCancel: false
    }));
    
    if (onError) {
      onError(error);
    }
  }, [onError]);

  /**
   * Handle completion
   */
  const handleComplete = useCallback((result: AIGenerationResult) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      isStreaming: false,
      canCancel: false,
      metadata: result.metadata || prev.metadata
    }));
    
    if (onComplete) {
      onComplete(result);
    }
  }, [onComplete]);

  /**
   * Generate streaming AI response
   */
  const generateStreaming = useCallback(async (
    provider: AIProvider,
    model: string,
    prompt: string,
    options: AIGenerationOptions = {}
  ) => {
    // Store request for retry
    lastRequestRef.current = { provider, model, prompt, options, streaming: true };

    // Clear previous debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the request
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Cancel any existing request
        if (controllerRef.current) {
          controllerRef.current.cancel('Starting new request');
        }

        // Clear previous response if configured
        if (autoClear) {
          setState(prev => ({
            ...prev,
            response: '',
            error: null,
            metadata: null
          }));
        }

        // Set loading state
        setState(prev => ({
          ...prev,
          isLoading: true,
          isStreaming: false,
          canCancel: true,
          error: null
        }));

        // Create new request controller
        controllerRef.current = new RequestController();

        // Start streaming
        await aiService.streamResponse(
          provider,
          model,
          prompt,
          { ...options, timeout: options.timeout || defaultTimeout },
          {
            onChunk: handleStreamChunk,
            onError: handleError,
            onComplete: handleComplete,
            signal: controllerRef.current.signal
          }
        );
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        controllerRef.current = null;
      }
    }, debounceMs);
  }, [autoClear, debounceMs, defaultTimeout, handleStreamChunk, handleError, handleComplete]);

  /**
   * Generate non-streaming AI response
   */
  const generateResponse = useCallback(async (
    provider: AIProvider,
    model: string,
    prompt: string,
    options: AIGenerationOptions = {}
  ) => {
    // Store request for retry
    lastRequestRef.current = { provider, model, prompt, options, streaming: false };

    try {
      // Cancel any existing request
      if (controllerRef.current) {
        controllerRef.current.cancel('Starting new request');
      }

      // Clear previous response if configured
      if (autoClear) {
        setState(prev => ({
          ...prev,
          response: '',
          error: null,
          metadata: null
        }));
      }

      // Set loading state
      setState(prev => ({
        ...prev,
        isLoading: true,
        isStreaming: false,
        canCancel: true,
        error: null
      }));

      // Create new request controller
      controllerRef.current = new RequestController();

      // Generate response
      const result = await aiService.generateResponse(
        provider,
        model,
        prompt,
        { ...options, timeout: options.timeout || defaultTimeout }
      );

      if (result.success && result.response) {
        setState(prev => ({
          ...prev,
          response: result.response || '',
          isLoading: false,
          canCancel: false,
          metadata: result.metadata || null
        }));
        
        if (onComplete) {
          onComplete(result);
        }
      } else {
        throw new Error(result.error || 'No response received');
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      controllerRef.current = null;
    }
  }, [autoClear, defaultTimeout, onComplete, handleError]);

  /**
   * Retry last request
   */
  const retry = useCallback(async () => {
    if (!lastRequestRef.current) {
      return;
    }

    const { provider, model, prompt, options, streaming } = lastRequestRef.current;
    
    if (streaming) {
      await generateStreaming(provider, model, prompt, options);
    } else {
      await generateResponse(provider, model, prompt, options);
    }
  }, [generateStreaming, generateResponse]);

  return {
    ...state,
    generateStreaming,
    generateResponse,
    cancel,
    clear,
    retry
  };
}

/**
 * Simple hook for one-off AI generations without streaming
 */
export function useAIGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    provider: AIProvider,
    model: string,
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiService.generateResponse(provider, model, prompt, options);
      
      if (result.success && result.response) {
        return result.response;
      } else {
        throw new Error(result.error || 'No response received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generate,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

/**
 * Hook for managing multiple concurrent AI requests
 */
export function useAIConcurrentRequests() {
  const [requests, setRequests] = useState<Map<string, AIStreamingState>>(new Map());
  const controllersRef = useRef<Map<string, RequestController>>(new Map());

  /**
   * Start a new concurrent request
   */
  const startRequest = useCallback(async (
    id: string,
    provider: AIProvider,
    model: string,
    prompt: string,
    options: AIGenerationOptions = {}
  ): Promise<string> => {
    // Cancel existing request with same ID
    const existingController = controllersRef.current.get(id);
    if (existingController) {
      existingController.cancel('Replacing with new request');
    }

    // Create new controller
    const controller = new RequestController();
    controllersRef.current.set(id, controller);

    // Initialize request state
    setRequests(prev => new Map(prev).set(id, {
      isLoading: true,
      isStreaming: false,
      response: '',
      error: null,
      metadata: null,
      canCancel: true
    }));

    try {
      const result = await aiService.generateResponse(provider, model, prompt, {
        ...options,
        timeout: options.timeout || 30000
      });

      if (result.success && result.response) {
        setRequests(prev => new Map(prev).set(id, {
          isLoading: false,
          isStreaming: false,
          response: result.response || '',
          error: null,
          metadata: result.metadata || null,
          canCancel: false
        }));
        return result.response;
      } else {
        throw new Error(result.error || 'No response received');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setRequests(prev => new Map(prev).set(id, {
        isLoading: false,
        isStreaming: false,
        response: '',
        error: errorMessage,
        metadata: null,
        canCancel: false
      }));
      throw error;
    } finally {
      controllersRef.current.delete(id);
    }
  }, []);

  /**
   * Cancel a specific request
   */
  const cancelRequest = useCallback((id: string) => {
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.cancel('Request cancelled by user');
      controllersRef.current.delete(id);
    }
    
    setRequests(prev => {
      const updated = new Map(prev);
      const request = updated.get(id);
      if (request) {
        updated.set(id, {
          ...request,
          isLoading: false,
          isStreaming: false,
          canCancel: false
        });
      }
      return updated;
    });
  }, []);

  /**
   * Remove a request from tracking
   */
  const removeRequest = useCallback((id: string) => {
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.cancel('Request removed');
      controllersRef.current.delete(id);
    }
    
    setRequests(prev => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });
  }, []);

  /**
   * Cancel all active requests
   */
  const cancelAll = useCallback(() => {
    controllersRef.current.forEach(controller => {
      controller.cancel('All requests cancelled');
    });
    controllersRef.current.clear();
    
    setRequests(prev => {
      const updated = new Map();
      prev.forEach((request, id) => {
        updated.set(id, {
          ...request,
          isLoading: false,
          isStreaming: false,
          canCancel: false
        });
      });
      return updated;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllersRef.current.forEach(controller => {
        controller.cancel('Component unmounting');
      });
    };
  }, []);

  return {
    requests,
    startRequest,
    cancelRequest,
    removeRequest,
    cancelAll,
    activeCount: controllersRef.current.size
  };
}