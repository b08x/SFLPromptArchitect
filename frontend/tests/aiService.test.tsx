import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Import the services and components to be tested
import { AIService } from '../services/aiService';
import ProviderSwitcher from '../components/ProviderSwitcher';
import { ProviderConfig } from '../types';

// Mock configuration and environment variables
const MOCK_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
    features: ['streaming', 'function_calling', 'structured_output']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    features: ['system_messages', 'long_context']
  },
  // Add other providers
];

// Mock AI service to simulate API calls
jest.mock('../services/aiService', () => ({
  AIService: {
    generateCompletion: jest.fn(),
    createStructuredRequest: jest.fn(),
    createFunctionCallingRequest: jest.fn(),
    getProviderDetails: jest.fn(),
  }
}));

describe('AI Service Frontend Integration', () => {
  // Provider Switching Tests
  describe('Provider Switching', () => {
    test('should switch providers correctly', () => {
      const { getByTestId } = render(<ProviderSwitcher providers={MOCK_PROVIDERS} />);
      
      const providerSelect = getByTestId('provider-select');
      fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
      
      expect(providerSelect.value).toBe('anthropic');
    });

    test('should update model list when provider changes', () => {
      const { getByTestId } = render(<ProviderSwitcher providers={MOCK_PROVIDERS} />);
      
      const providerSelect = getByTestId('provider-select');
      const modelSelect = getByTestId('model-select');
      
      fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
      
      const availableModels = Array.from(modelSelect.children).map(option => option.textContent);
      expect(availableModels).toEqual(['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']);
    });
  });

  // Streaming Tests
  describe('Streaming Functionality', () => {
    test('should handle streaming response', async () => {
      const mockStreamingResponse = {
        type: 'streaming',
        chunks: [
          { delta: 'Hello ', index: 0 },
          { delta: 'world', index: 1 },
          { delta: '!', index: 2 }
        ]
      };

      // Mock the generateCompletion method to return a streaming response
      (AIService.generateCompletion as jest.Mock).mockResolvedValue(mockStreamingResponse);

      const mockOnStreamUpdate = jest.fn();
      const mockOnComplete = jest.fn();

      await act(async () => {
        await AIService.generateCompletion({
          provider: 'openai',
          model: 'gpt-4o',
          prompt: 'Test streaming',
          stream: true,
          onStreamUpdate: mockOnStreamUpdate,
          onComplete: mockOnComplete
        });
      });

      // Verify streaming updates
      expect(mockOnStreamUpdate).toHaveBeenCalledTimes(3);
      expect(mockOnComplete).toHaveBeenCalledWith('Hello world!');
    });

    test('should handle streaming errors', async () => {
      const mockErrorResponse = {
        type: 'error',
        message: 'Streaming failed'
      };

      (AIService.generateCompletion as jest.Mock).mockRejectedValue(mockErrorResponse);

      const mockOnError = jest.fn();

      await act(async () => {
        await AIService.generateCompletion({
          provider: 'openai',
          model: 'gpt-4o',
          prompt: 'Test streaming error',
          stream: true,
          onError: mockOnError
        });
      });

      expect(mockOnError).toHaveBeenCalledWith(mockErrorResponse);
    });
  });

  // Advanced Feature Tests
  describe('Advanced Features', () => {
    test('should create structured output request', async () => {
      const mockStructuredRequest = {
        type: 'structured',
        jsonSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          }
        }
      };

      (AIService.createStructuredRequest as jest.Mock).mockResolvedValue(mockStructuredRequest);

      const result = await AIService.createStructuredRequest({
        provider: 'openai',
        model: 'gpt-4o',
        prompt: 'Generate a person profile',
        schema: mockStructuredRequest.jsonSchema
      });

      expect(result).toEqual(mockStructuredRequest);
    });

    test('should create function calling request', async () => {
      const mockFunctionCallingRequest = {
        type: 'function_calling',
        tools: [
          {
            name: 'get_weather',
            description: 'Get current weather',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' }
              }
            }
          }
        ]
      };

      (AIService.createFunctionCallingRequest as jest.Mock).mockResolvedValue(mockFunctionCallingRequest);

      const result = await AIService.createFunctionCallingRequest({
        provider: 'openai',
        model: 'gpt-4o',
        prompt: 'What is the weather?',
        tools: mockFunctionCallingRequest.tools
      });

      expect(result).toEqual(mockFunctionCallingRequest);
    });
  });

  // Provider Configuration Tests
  describe('Provider Configuration', () => {
    test('should retrieve provider details', async () => {
      const mockProviderDetails = {
        id: 'openai',
        name: 'OpenAI',
        apiKeyRequired: true,
        supportedFeatures: ['streaming', 'function_calling'],
        pricingInfo: {
          inputTokenCost: 0.01,
          outputTokenCost: 0.03
        }
      };

      (AIService.getProviderDetails as jest.Mock).mockResolvedValue(mockProviderDetails);

      const result = await AIService.getProviderDetails('openai');

      expect(result).toEqual(mockProviderDetails);
      expect(result.apiKeyRequired).toBe(true);
      expect(result.supportedFeatures).toContain('streaming');
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    test('should handle API key validation errors', async () => {
      const mockApiKeyError = {
        type: 'api_key_error',
        provider: 'openai',
        message: 'Invalid API key'
      };

      (AIService.generateCompletion as jest.Mock).mockRejectedValue(mockApiKeyError);

      const mockOnError = jest.fn();

      await act(async () => {
        await AIService.generateCompletion({
          provider: 'openai',
          model: 'gpt-4o',
          prompt: 'Test API key error',
          onError: mockOnError
        });
      });

      expect(mockOnError).toHaveBeenCalledWith(mockApiKeyError);
    });

    test('should handle parameter validation errors', async () => {
      const mockParameterError = {
        type: 'parameter_error',
        provider: 'anthropic',
        message: 'Invalid temperature value'
      };

      (AIService.generateCompletion as jest.Mock).mockRejectedValue(mockParameterError);

      const mockOnError = jest.fn();

      await act(async () => {
        await AIService.generateCompletion({
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          prompt: 'Test parameter error',
          parameters: { temperature: 2.0 }, // Invalid temperature
          onError: mockOnError
        });
      });

      expect(mockOnError).toHaveBeenCalledWith(mockParameterError);
    });
  });
});