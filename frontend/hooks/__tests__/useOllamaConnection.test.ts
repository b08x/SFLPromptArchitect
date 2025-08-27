/**
 * @file useOllamaConnection.test.ts
 * @description Tests for the useOllamaConnection custom hook.
 * Tests connection management, model discovery, and error handling.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { jest, expect, describe, it, beforeEach, afterEach } from '@jest/globals';
import { useOllamaConnection } from '../useOllamaConnection';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useOllamaConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useOllamaConnection());
    
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.availableModels).toEqual([]);
    expect(result.current.isLoadingModels).toBe(false);
    expect(result.current.connectionError).toBe('');
    expect(result.current.lastConnectionTest).toBe(0);
  });

  describe('testConnection', () => {
    it('successfully connects to Ollama server', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ version: '0.1.0' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [
              { name: 'llama2:7b', size: 3800000000, model: 'llama2:7b' },
              { name: 'mistral:7b', size: 4100000000, model: 'mistral:7b' }
            ]
          })
        });

      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        const success = await result.current.testConnection('http://localhost:11434');
        expect(success).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected');
        expect(result.current.availableModels).toHaveLength(2);
        expect(result.current.connectionError).toBe('');
        expect(result.current.lastConnectionTest).toBeGreaterThan(0);
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/version', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: expect.any(AbortSignal)
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: expect.any(AbortSignal)
      });
    });

    it('handles connection failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        const success = await result.current.testConnection('http://localhost:11434');
        expect(success).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('error');
        expect(result.current.connectionError).toBe('Connection failed: ECONNREFUSED');
        expect(result.current.availableModels).toEqual([]);
      });
    });

    it('handles server error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        const success = await result.current.testConnection('http://localhost:11434');
        expect(success).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('error');
        expect(result.current.connectionError).toBe('Connection failed: Server responded with status 500');
      });
    });

    it('validates base URL requirement', async () => {
      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        const success = await result.current.testConnection('');
        expect(success).toBe(false);
      });

      expect(result.current.connectionStatus).toBe('error');
      expect(result.current.connectionError).toBe('Base URL is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sets connecting status during request', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useOllamaConnection());

      act(() => {
        result.current.testConnection('http://localhost:11434');
      });

      // Check that status is immediately set to connecting
      expect(result.current.connectionStatus).toBe('connecting');

      // Resolve the promise
      act(() => {
        resolvePromise!({
          ok: true,
          json: async () => ({ version: '0.1.0' })
        });
      });
    });

    it('handles request cancellation', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        const success = await result.current.testConnection('http://localhost:11434');
        expect(success).toBe(false);
      });

      // State should not change when request is aborted
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.connectionError).toBe('');
    });
  });

  describe('fetchAvailableModels', () => {
    it('successfully fetches and sorts models', async () => {
      const mockModels = [
        { name: 'zephyr:7b', size: 4100000000, model: 'zephyr:7b' },
        { name: 'llama2:7b', size: 3800000000, model: 'llama2:7b' },
        { name: 'mistral:7b', size: 4100000000, model: 'mistral:7b' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: mockModels })
      });

      const { result } = renderHook(() => useOllamaConnection());

      let fetchedModels: any[] = [];
      await act(async () => {
        fetchedModels = await result.current.fetchAvailableModels('http://localhost:11434');
      });

      // Models should be sorted by name
      expect(fetchedModels).toEqual([
        { name: 'llama2:7b', size: 3800000000, model: 'llama2:7b' },
        { name: 'mistral:7b', size: 4100000000, model: 'mistral:7b' },
        { name: 'zephyr:7b', size: 4100000000, model: 'zephyr:7b' }
      ]);
      expect(result.current.availableModels).toEqual(fetchedModels);
      expect(result.current.isLoadingModels).toBe(false);
    });

    it('handles empty models response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      });

      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        const models = await result.current.fetchAvailableModels('http://localhost:11434');
        expect(models).toEqual([]);
      });

      expect(result.current.availableModels).toEqual([]);
    });

    it('handles missing models property in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}) // No models property
      });

      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        const models = await result.current.fetchAvailableModels('http://localhost:11434');
        expect(models).toEqual([]);
      });
    });

    it('handles server error when fetching models', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        await expect(
          result.current.fetchAvailableModels('http://localhost:11434')
        ).rejects.toThrow('Failed to fetch models: 404');
      });

      expect(result.current.connectionError).toBe('Failed to fetch models: 404');
      expect(result.current.availableModels).toEqual([]);
      expect(result.current.isLoadingModels).toBe(false);
    });

    it('validates base URL requirement', async () => {
      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        await expect(
          result.current.fetchAvailableModels('')
        ).rejects.toThrow('Base URL is required');
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useOllamaConnection());

      act(() => {
        result.current.fetchAvailableModels('http://localhost:11434');
      });

      // Check that loading state is immediately set
      expect(result.current.isLoadingModels).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise!({
          ok: true,
          json: async () => ({ models: [] })
        });
      });

      await waitFor(() => {
        expect(result.current.isLoadingModels).toBe(false);
      });
    });
  });

  describe('resetConnection', () => {
    it('resets all state to initial values', async () => {
      // First establish a connection
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ version: '0.1.0' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [{ name: 'llama2:7b', size: 3800000000, model: 'llama2:7b' }]
          })
        });

      const { result } = renderHook(() => useOllamaConnection());

      await act(async () => {
        await result.current.testConnection('http://localhost:11434');
      });

      // Verify connected state
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.availableModels).toHaveLength(1);

      // Reset connection
      act(() => {
        result.current.resetConnection();
      });

      // Verify reset state
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.availableModels).toEqual([]);
      expect(result.current.isLoadingModels).toBe(false);
      expect(result.current.connectionError).toBe('');
      expect(result.current.lastConnectionTest).toBe(0);
    });

    it('cancels in-flight requests when resetting', async () => {
      let abortController: AbortController | null = null;
      
      mockFetch.mockImplementationOnce((_url, options) => {
        abortController = options?.signal?.constructor === AbortSignal ? 
          { abort: jest.fn() } as any : null;
        
        return new Promise(() => {}); // Never resolves
      });

      const { result } = renderHook(() => useOllamaConnection());

      // Start a connection test
      act(() => {
        result.current.testConnection('http://localhost:11434');
      });

      // Reset connection (should cancel the request)
      act(() => {
        result.current.resetConnection();
      });

      // The connection status should be reset
      expect(result.current.connectionStatus).toBe('disconnected');
    });
  });

  describe('concurrent requests', () => {
    it('cancels previous request when starting new one', async () => {
      let firstResolve: (value: any) => void;
      const firstPromise = new Promise(resolve => {
        firstResolve = resolve;
      });
      
      mockFetch
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ version: '0.1.0' })
        });

      const { result } = renderHook(() => useOllamaConnection());

      // Start first connection
      act(() => {
        result.current.testConnection('http://localhost:11434');
      });

      expect(result.current.connectionStatus).toBe('connecting');

      // Start second connection before first completes
      await act(async () => {
        const success = await result.current.testConnection('http://localhost:11434');
        expect(success).toBe(true);
      });

      // First promise resolve should be ignored
      act(() => {
        firstResolve!({
          ok: true,
          json: async () => ({ version: '0.1.0' })
        });
      });

      expect(result.current.connectionStatus).toBe('connected');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});